/**
 * deduplicator.ts — In-memory event deduplication
 *
 * Prevents the same news event from being stored multiple times when multiple
 * sources report it within a short window.
 *
 * Strategy:
 *  - Normalize the title (lowercase, strip punctuation, remove filler words)
 *  - Bucket pubDate into 2-hour windows
 *  - Build a dedup key = hash of (normalized title + date bucket)
 *  - Store seen keys in a Map with TTL; evict entries older than 6 hours
 *
 * This module is intentionally stateless across worker restarts (in-memory
 * only). The DB-level dedupHash in rssAggregator.ts handles persistence;
 * this layer is a cheap fast-path before DB queries.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const WINDOW_MS = 2 * 60 * 60 * 1000;  // 2-hour bucket
const TTL_MS    = 6 * 60 * 60 * 1000;  // evict after 6 hours

// ─── Internal state ───────────────────────────────────────────────────────────

interface SeenEntry {
  seenAt: number; // Date.now()
}

const seenMap = new Map<string, SeenEntry>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FILLER_WORDS = /\b(says|said|reports|reported|breaking|update|exclusive|sources?|officials?|live)\b/g;

/**
 * Normalise a headline for deduplication:
 *  - lowercase
 *  - remove punctuation
 *  - strip common filler words
 *  - collapse whitespace
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(FILLER_WORDS, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Bucket a timestamp into 2-hour windows so articles published within the
 * same window share the same bucket string.
 */
function dateBucket(pubDate: string): string {
  const ts = new Date(pubDate).getTime();
  // If invalid date, fall back to current time bucket
  const t = isNaN(ts) ? Date.now() : ts;
  const bucket = Math.floor(t / WINDOW_MS);
  return String(bucket);
}

/**
 * djb2 hash — fast, simple, no crypto APIs needed (Workers-compatible).
 */
function djb2(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash | 0; // keep 32-bit
  }
  return (hash >>> 0).toString(16);
}

function buildKey(title: string, pubDate: string): string {
  const normalized = normalizeTitle(title);
  const bucket = dateBucket(pubDate);
  return djb2(`${normalized}|${bucket}`);
}

/** Remove entries older than TTL_MS. */
function evictStale(): void {
  const cutoff = Date.now() - TTL_MS;
  for (const [key, entry] of seenMap) {
    if (entry.seenAt < cutoff) seenMap.delete(key);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns true if this (title, pubDate) combination has already been seen
 * within the deduplication window.
 */
export function isDuplicate(title: string, pubDate: string): boolean {
  evictStale();
  const key = buildKey(title, pubDate);
  return seenMap.has(key);
}

/**
 * Record that we have processed this (title, pubDate) combination so future
 * calls to `isDuplicate` will return true for the same event.
 */
export function markSeen(title: string, pubDate: string): void {
  const key = buildKey(title, pubDate);
  seenMap.set(key, { seenAt: Date.now() });
}
