/**
 * Event Deduplication System
 *
 * Determines if an incoming raw article is about the same event as a
 * recently-ingested alert using three criteria (ALL must match):
 *
 *   1. Title similarity  > 0.80   (Jaccard on bigrams)
 *   2. Time window       < 4 h    (article publishedAt vs alert publishedAt)
 *   3. Same geo region            (same countryCode, or both null)
 *
 * When a match is found:
 *   - The new source is appended to the alert's sourceIds
 *   - Confidence score is recalculated
 *   - The article's dedupGroupId is set to the matched alert's id
 *
 * When no match is found a new alert record is created (caller's responsibility).
 */

import { getDb, type Env } from "../../db/client";
import { alerts } from "../../db/schema";
import { gte, and, or, isNull, eq } from "drizzle-orm";
import { scoreConfidence } from "./confidenceScorer";

// ─── Constants ────────────────────────────────────────────────────────────────

const SIMILARITY_THRESHOLD = 0.80;
const TIME_WINDOW_MS = 4 * 60 * 60 * 1000; // 4 hours

// ─── Text normalisation ───────────────────────────────────────────────────────

/** Strip punctuation, lowercase, collapse whitespace. */
export function normalizeTitle(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tokenise into bigrams (pairs of consecutive words). */
export function toBigrams(text: string): Set<string> {
  const words = text.split(" ").filter(Boolean);
  const bigrams = new Set<string>();
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.add(`${words[i]} ${words[i + 1]}`);
  }
  // Also include unigrams for short titles
  if (words.length <= 4) {
    words.forEach((w) => bigrams.add(w));
  }
  return bigrams;
}

/**
 * Jaccard similarity on bigram sets.
 * Returns a value between 0 (no overlap) and 1 (identical).
 */
export function jaccardSimilarity(a: string, b: string): number {
  const setA = toBigrams(normalizeTitle(a));
  const setB = toBigrams(normalizeTitle(b));

  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return intersection / union;
}

// ─── Geo region matching ──────────────────────────────────────────────────────

/**
 * Two events are in the "same geo region" if:
 *   - both have the same countryCode, OR
 *   - both have no countryCode (unknown region — still let title similarity decide)
 */
export function sameGeoRegion(
  countryA: string | null | undefined,
  countryB: string | null | undefined
): boolean {
  if (!countryA && !countryB) return true;  // both unknown
  if (!countryA || !countryB) return false; // one known, one not
  return countryA.toUpperCase() === countryB.toUpperCase();
}

// ─── Core deduplication logic ─────────────────────────────────────────────────

export interface ArticleCandidate {
  title: string;
  publishedAt: Date;
  countryCode?: string | null;
}

export interface DeduplicationMatch {
  alertId: string;
  similarity: number;
  headline: string;
}

/**
 * Find the best-matching existing alert for an incoming article, or return null.
 *
 * Queries only alerts published within the 4-hour window to keep the
 * candidate set small.
 */
export async function findDuplicateAlert(
  env: Env,
  candidate: ArticleCandidate
): Promise<DeduplicationMatch | null> {
  const db = getDb(env);

  const windowStart = new Date(candidate.publishedAt.getTime() - TIME_WINDOW_MS);

  // Fetch recent alerts within the time window
  // Also include slightly older alerts (candidate might be late-arriving)
  const recentAlerts = await db
    .select({
      id: alerts.id,
      headline: alerts.headline,
      countryCode: alerts.countryCode,
      publishedAt: alerts.publishedAt,
    })
    .from(alerts)
    .where(gte(alerts.publishedAt, windowStart));

  let bestMatch: DeduplicationMatch | null = null;
  let bestScore = SIMILARITY_THRESHOLD; // must exceed threshold

  for (const alert of recentAlerts) {
    // Geo region check
    if (!sameGeoRegion(candidate.countryCode, alert.countryCode)) continue;

    // Time window check (bidirectional: alert might have come in before or after)
    const timeDiff = Math.abs(
      candidate.publishedAt.getTime() - alert.publishedAt.getTime()
    );
    if (timeDiff > TIME_WINDOW_MS) continue;

    // Title similarity
    const sim = jaccardSimilarity(candidate.title, alert.headline);
    if (sim > bestScore) {
      bestScore = sim;
      bestMatch = { alertId: alert.id, similarity: sim, headline: alert.headline };
    }
  }

  return bestMatch;
}

// ─── Pipeline entry point ─────────────────────────────────────────────────────

export interface DeduplicationResult {
  action: "merged" | "new";
  alertId: string;
  similarity?: number;
}

/**
 * Run the deduplication pipeline for one incoming article.
 *
 * Returns whether a duplicate was found (and updated) or a new alert is needed.
 * Callers should only insert a new alert when action === "new".
 */
export async function runDeduplication(
  env: Env,
  candidate: ArticleCandidate,
  sourceRow: { id: string; trustRank: number }
): Promise<DeduplicationResult> {
  const match = await findDuplicateAlert(env, candidate);

  if (!match) {
    return { action: "new", alertId: "" };
  }

  const db = getDb(env);

  // Fetch full alert for source list
  const [existing] = await db
    .select()
    .from(alerts)
    .where(eq(alerts.id, match.alertId))
    .limit(1);

  if (!existing) return { action: "new", alertId: "" };

  const existingSourceIds: string[] = existing.sourceIds ?? [];

  if (!existingSourceIds.includes(sourceRow.id)) {
    const newSourceIds = [...existingSourceIds, sourceRow.id];

    // Re-score confidence with additional corroboration
    const result = scoreConfidence({
      sourceIds: newSourceIds,
      sourceTrustRanks: [
        sourceRow.trustRank,
        ...Array(existingSourceIds.length).fill(70),
      ],
      publishedAt: existing.publishedAt,
      isBreaking: existing.isBreaking,
    });

    await db
      .update(alerts)
      .set({
        sourceIds: newSourceIds,
        confidenceScore: result.score,
        confidenceLabel: result.label,
        updatedAt: new Date(),
        // Mark the dedup group if not already set
        dedupGroupId: existing.dedupGroupId ?? existing.id,
      })
      .where(eq(alerts.id, existing.id));

    console.log(
      `[dedup] Merged article "${candidate.title.slice(0, 60)}" ` +
      `→ alert ${existing.id} (sim=${match.similarity.toFixed(3)}, ` +
      `sources: ${existingSourceIds.length} → ${newSourceIds.length})`
    );
  }

  return {
    action: "merged",
    alertId: match.alertId,
    similarity: match.similarity,
  };
}

// ─── Monitoring helpers ───────────────────────────────────────────────────────

export interface DeduplicationStats {
  total: number;
  merged: number;
  created: number;
  dedupRate: number; // 0–1
}

export function summariseDeduplicationRun(results: DeduplicationResult[]): DeduplicationStats {
  const total = results.length;
  const merged = results.filter((r) => r.action === "merged").length;
  const created = total - merged;
  const dedupRate = total > 0 ? merged / total : 0;
  return { total, merged, created, dedupRate };
}
