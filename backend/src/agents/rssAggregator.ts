import { getDb, type Env } from "../../db/client";
import { alerts, sources, strikes } from "../../db/schema";
import { eq, inArray } from "drizzle-orm";
import { scoreConfidence, getConfidenceLabel } from "./confidenceScorer";

// ─── War keyword filter ───────────────────────────────────────────────────────

const WAR_KEYWORDS = [
  "israel", "iran", "idf", "irgc", "strike", "missile", "airstrike", "bombing",
  "hezbollah", "hamas", "houthi", "gaza", "beirut", "tehran", "tel aviv",
  "war", "ceasefire", "nuclear", "sanction", "hostage", "evacuation",
  "us military", "pentagon", "red sea", "strait of hormuz", "ballistic",
  "drone attack", "embassy", "casualties", "killed", "wounded",
  "middle east", "mossad", "quds force", "proxy",
];

export function isWarRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  return WAR_KEYWORDS.some((kw) => lower.includes(kw));
}

export function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  return WAR_KEYWORDS.filter((kw) => lower.includes(kw));
}

// ─── Source registry ──────────────────────────────────────────────────────────

export interface SourceDef {
  slug: string;
  name: string;
  rssUrl: string;
  trustRank: number;
  countries: string[];
  categories: string[];
}

export const SOURCE_REGISTRY: Record<string, SourceDef> = {
  "reuters-world": {
    slug: "reuters-world",
    name: "Reuters World",
    rssUrl: "https://feeds.reuters.com/reuters/worldNews",
    trustRank: 95,
    countries: [],
    categories: ["news", "world"],
  },
  "ap-news": {
    slug: "ap-news",
    name: "Associated Press",
    rssUrl: "https://rsshub.app/apnews/topics/apf-intlnews",
    trustRank: 95,
    countries: [],
    categories: ["news", "world"],
  },
  "bbc-world": {
    slug: "bbc-world",
    name: "BBC World News",
    rssUrl: "http://feeds.bbci.co.uk/news/world/rss.xml",
    trustRank: 90,
    countries: [],
    categories: ["news", "world"],
  },
  "al-jazeera": {
    slug: "al-jazeera",
    name: "Al Jazeera",
    rssUrl: "https://www.aljazeera.com/xml/rss/all.xml",
    trustRank: 82,
    countries: ["QA"],
    categories: ["news", "middle-east"],
  },
  "haaretz": {
    slug: "haaretz",
    name: "Haaretz",
    rssUrl: "https://www.haaretz.com/cmlink/1.628752",
    trustRank: 80,
    countries: ["IL"],
    categories: ["news", "israel"],
  },
  "times-of-israel": {
    slug: "times-of-israel",
    name: "The Times of Israel",
    rssUrl: "https://www.timesofisrael.com/feed/",
    trustRank: 78,
    countries: ["IL"],
    categories: ["news", "israel"],
  },
  "iran-international": {
    slug: "iran-international",
    name: "Iran International",
    rssUrl: "https://www.iranintl.com/en/rss",
    trustRank: 75,
    countries: ["IR"],
    categories: ["news", "iran"],
  },
  "naharnet": {
    slug: "naharnet",
    name: "Naharnet (Lebanon)",
    rssUrl: "https://www.naharnet.com/stories/en/rss",
    trustRank: 72,
    countries: ["LB"],
    categories: ["news", "lebanon"],
  },
  "arab-news": {
    slug: "arab-news",
    name: "Arab News",
    rssUrl: "https://www.arabnews.com/rss",
    trustRank: 75,
    countries: ["SA"],
    categories: ["news", "middle-east"],
  },
  "the-guardian-world": {
    slug: "the-guardian-world",
    name: "The Guardian World",
    rssUrl: "https://www.theguardian.com/world/rss",
    trustRank: 88,
    countries: [],
    categories: ["news", "world"],
  },
  "france24": {
    slug: "france24",
    name: "France 24",
    rssUrl: "https://www.france24.com/en/rss",
    trustRank: 83,
    countries: [],
    categories: ["news", "world"],
  },
  "sky-news": {
    slug: "sky-news",
    name: "Sky News",
    rssUrl: "http://feeds.skynews.com/feeds/rss/world.xml",
    trustRank: 82,
    countries: [],
    categories: ["news", "world"],
  },
  "i24-news": {
    slug: "i24-news",
    name: "i24 News",
    rssUrl: "https://www.i24news.tv/en/rss",
    trustRank: 74,
    countries: ["IL"],
    categories: ["news", "israel"],
  },
  "yemen-observer": {
    slug: "yemen-observer",
    name: "Yemen Observer",
    rssUrl: "http://www.yobserver.com/feed/",
    trustRank: 60,
    countries: ["YE"],
    categories: ["news", "yemen"],
  },
  "iraq-news": {
    slug: "iraq-news",
    name: "Baghdad Post",
    rssUrl: "https://www.thebaghdadpost.com/en/rss",
    trustRank: 62,
    countries: ["IQ"],
    categories: ["news", "iraq"],
  },
};

// Country → source slug mapping for dynamic source selection
const COUNTRY_SOURCE_MAP: Record<string, string[]> = {
  IL: ["haaretz", "times-of-israel", "i24-news", "reuters-world", "bbc-world"],
  IR: ["iran-international", "reuters-world", "bbc-world", "france24"],
  LB: ["naharnet", "al-jazeera", "reuters-world"],
  YE: ["yemen-observer", "al-jazeera", "reuters-world"],
  IQ: ["iraq-news", "al-jazeera", "reuters-world"],
  SA: ["arab-news", "reuters-world", "bbc-world"],
  PS: ["al-jazeera", "times-of-israel", "reuters-world", "bbc-world"],
};

export function getSourcesForCountries(countries: string[]): string[] {
  const slugSet = new Set<string>();
  // Always include global sources
  ["reuters-world", "ap-news", "bbc-world", "the-guardian-world"].forEach((s) => slugSet.add(s));
  for (const cc of countries) {
    const mapped = COUNTRY_SOURCE_MAP[cc.toUpperCase()] ?? [];
    mapped.forEach((s) => slugSet.add(s));
  }
  return Array.from(slugSet);
}

// ─── Geocoding (static lookup) ───────────────────────────────────────────────

export interface GeoLocation {
  name: string;
  lat: number;
  lng: number;
  countryCode: string;
}

export const GEO_LOOKUP: Record<string, GeoLocation> = {
  "tel aviv": { name: "Tel Aviv", lat: 32.0853, lng: 34.7818, countryCode: "IL" },
  "jerusalem": { name: "Jerusalem", lat: 31.7683, lng: 35.2137, countryCode: "IL" },
  "haifa": { name: "Haifa", lat: 32.7940, lng: 34.9896, countryCode: "IL" },
  "beersheba": { name: "Beersheba", lat: 31.2516, lng: 34.7913, countryCode: "IL" },
  "gaza": { name: "Gaza", lat: 31.5017, lng: 34.4668, countryCode: "PS" },
  "rafah": { name: "Rafah", lat: 31.2805, lng: 34.2506, countryCode: "PS" },
  "khan younis": { name: "Khan Younis", lat: 31.3452, lng: 34.3064, countryCode: "PS" },
  "beirut": { name: "Beirut", lat: 33.8938, lng: 35.5018, countryCode: "LB" },
  "south lebanon": { name: "South Lebanon", lat: 33.2720, lng: 35.2033, countryCode: "LB" },
  "tyre": { name: "Tyre", lat: 33.2705, lng: 35.2038, countryCode: "LB" },
  "tehran": { name: "Tehran", lat: 35.6892, lng: 51.3890, countryCode: "IR" },
  "isfahan": { name: "Isfahan", lat: 32.6546, lng: 51.6680, countryCode: "IR" },
  "natanz": { name: "Natanz", lat: 33.7234, lng: 51.7266, countryCode: "IR" },
  "baghdad": { name: "Baghdad", lat: 33.3152, lng: 44.3661, countryCode: "IQ" },
  "erbil": { name: "Erbil", lat: 36.1901, lng: 44.0091, countryCode: "IQ" },
  "mosul": { name: "Mosul", lat: 36.3400, lng: 43.1300, countryCode: "IQ" },
  "damascus": { name: "Damascus", lat: 33.5138, lng: 36.2765, countryCode: "SY" },
  "aleppo": { name: "Aleppo", lat: 36.2021, lng: 37.1343, countryCode: "SY" },
  "sanaa": { name: "Sanaa", lat: 15.3694, lng: 44.1910, countryCode: "YE" },
  "hodeidah": { name: "Hodeidah", lat: 14.7978, lng: 42.9541, countryCode: "YE" },
  "riyadh": { name: "Riyadh", lat: 24.7136, lng: 46.6753, countryCode: "SA" },
  "jeddah": { name: "Jeddah", lat: 21.3891, lng: 39.8579, countryCode: "SA" },
  "amman": { name: "Amman", lat: 31.9539, lng: 35.9106, countryCode: "JO" },
  "cairo": { name: "Cairo", lat: 30.0444, lng: 31.2357, countryCode: "EG" },
  "red sea": { name: "Red Sea", lat: 20.0, lng: 38.0, countryCode: "XX" },
  "strait of hormuz": { name: "Strait of Hormuz", lat: 26.5553, lng: 56.2500, countryCode: "XX" },
};

export function geocodeText(text: string): GeoLocation | null {
  const lower = text.toLowerCase();
  // Check longer names first to avoid partial matches
  const sortedKeys = Object.keys(GEO_LOOKUP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (lower.includes(key)) {
      return GEO_LOOKUP[key] ?? null;
    }
  }
  return null;
}

// ─── Deduplication ────────────────────────────────────────────────────────────

export function generateDedupHash(headline: string, publishedAt: Date): string {
  const normalized = headline
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  const dateStr = publishedAt.toISOString().slice(0, 10);
  // Simple hash (djb2)
  let hash = 5381;
  const str = `${normalized}|${dateStr}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // 32-bit
  }
  return `${Math.abs(hash).toString(16)}-${str.length}`;
}

// ─── Category detection ───────────────────────────────────────────────────────

const CATEGORY_PATTERNS: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /airstrike|air strike|bombing|bomb|aerial/i, category: "strike" },
  { pattern: /missile|rocket|ballistic|projectile/i, category: "missile" },
  { pattern: /drone|uav|unmanned/i, category: "drone" },
  { pattern: /ceasefire|cease-fire|truce|armistice/i, category: "ceasefire" },
  { pattern: /nuclear|uranium|enrichment|warhead/i, category: "nuclear" },
  { pattern: /sanction|embargo|export control/i, category: "sanctions" },
  { pattern: /hostage|captive|prisoner/i, category: "hostage" },
  { pattern: /evacuation|evacuate|flee|displacement/i, category: "evacuation" },
  { pattern: /diplomacy|diplomat|negotiat|summit|talks/i, category: "diplomatic" },
  { pattern: /naval|ship|vessel|port|sea/i, category: "naval" },
  { pattern: /ground|infantry|troops|soldier/i, category: "ground" },
];

export function detectCategory(text: string): string {
  for (const { pattern, category } of CATEGORY_PATTERNS) {
    if (pattern.test(text)) return category;
  }
  return "general";
}

// ─── Strike detection ─────────────────────────────────────────────────────────

const STRIKE_KEYWORDS = /airstrike|air strike|missile strike|drone strike|bombing|bomb|rocket fire|shelling/i;

export function isStrikeEvent(text: string): boolean {
  return STRIKE_KEYWORDS.test(text);
}

export function detectStrikeType(text: string): string {
  if (/airstrike|air strike|aerial/i.test(text)) return "airstrike";
  if (/missile/i.test(text)) return "missile";
  if (/drone/i.test(text)) return "drone";
  if (/naval|ship/i.test(text)) return "naval";
  if (/shelling|artillery/i.test(text)) return "ground";
  return "airstrike";
}

// ─── RSS Item type ────────────────────────────────────────────────────────────

export interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet?: string;
  content?: string;
}

// ─── Main aggregator function ─────────────────────────────────────────────────

export async function processRssItems(
  env: Env,
  sourceDef: SourceDef,
  sourceRow: { id: string; trustRank: number },
  items: RssItem[]
): Promise<number> {
  const db = getDb(env);
  let inserted = 0;

  for (const item of items) {
    const text = `${item.title ?? ""} ${item.contentSnippet ?? ""}`;

    if (!isWarRelevant(text)) continue;

    const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();
    if (isNaN(publishedAt.getTime())) continue;

    const dedupHash = generateDedupHash(item.title ?? "", publishedAt);

    // Check for existing alert with same dedup hash
    const [existing] = await db
      .select()
      .from(alerts)
      .where(eq(alerts.dedupHash, dedupHash))
      .limit(1);

    if (existing) {
      // Add source to existing alert + recalculate confidence
      const existingSourceIds = existing.sourceIds ?? [];
      if (!existingSourceIds.includes(sourceRow.id)) {
        const newSourceIds = [...existingSourceIds, sourceRow.id];
        // Re-score with new corroboration
        const result = scoreConfidence({
          sourceIds: newSourceIds,
          sourceTrustRanks: [sourceRow.trustRank, ...Array(existingSourceIds.length).fill(70)],
          publishedAt,
          isBreaking: existing.confidenceScore >= 0.8,
        });
        await db
          .update(alerts)
          .set({
            sourceIds: newSourceIds,
            confidenceScore: result.score,
            confidenceLabel: result.label,
            updatedAt: new Date(),
          })
          .where(eq(alerts.id, existing.id));
      }
      continue;
    }

    // New alert
    const geo = geocodeText(text);
    const keywords = extractKeywords(text);
    const category = detectCategory(text);
    const isBreaking = text.toLowerCase().includes("breaking");

    const confidenceResult = scoreConfidence({
      sourceIds: [sourceRow.id],
      sourceTrustRanks: [sourceRow.trustRank],
      publishedAt,
      isBreaking,
    });

    const [alert] = await db
      .insert(alerts)
      .values({
        headline: (item.title ?? "").slice(0, 1000),
        summary: item.contentSnippet?.slice(0, 2000),
        url: item.link ?? "",
        lat: geo?.lat,
        lng: geo?.lng,
        locationName: geo?.name,
        countryCode: geo?.countryCode,
        category,
        topics: keywords,
        keywords,
        confidenceScore: confidenceResult.score,
        confidenceLabel: confidenceResult.label,
        sourceIds: [sourceRow.id],
        primarySourceId: sourceRow.id,
        dedupHash,
        publishedAt,
      })
      .onConflictDoNothing()
      .returning();

    if (!alert) continue;
    inserted++;

    // If strike event, also insert into strikes table
    if (geo && isStrikeEvent(text)) {
      await db
        .insert(strikes)
        .values({
          alertId: alert.id,
          lat: geo.lat,
          lng: geo.lng,
          locationName: geo.name,
          countryCode: geo.countryCode,
          strikeType: detectStrikeType(text),
          sourceIds: [sourceRow.id],
          confidenceScore: confidenceResult.score,
          publishedAt,
        })
        .onConflictDoNothing();
    }
  }

  return inserted;
}
