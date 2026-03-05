import { getDb, type Env } from "../../db/client";
import { alerts, sources, strikes } from "../../db/schema";
import { eq, inArray } from "drizzle-orm";
import { scoreConfidence, getConfidenceLabel } from "./confidenceScorer";
import { geocodeTextAsync } from "./geocoder";
import { GeoLocation, GEO_LOOKUP, geocodeText } from "./geoData";

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
  "afp": {
    slug: "afp",
    name: "AFP",
    rssUrl: "https://www.afp.com/en/agencies/en/rss",
    trustRank: 95,
    countries: [],
    categories: ["news", "world"],
  },
  "cnn-meast": {
    slug: "cnn-meast",
    name: "CNN Middle East",
    rssUrl: "http://rss.cnn.com/rss/edition_meast.rss",
    trustRank: 82,
    countries: [],
    categories: ["news", "middle-east"],
  },
  "jerusalem-post": {
    slug: "jerusalem-post",
    name: "The Jerusalem Post",
    rssUrl: "https://www.jpost.com/rss/rssfeedsfrontpage.aspx",
    trustRank: 72,
    countries: ["IL"],
    categories: ["news", "israel"],
  },
  "ynet-news": {
    slug: "ynet-news",
    name: "Ynet News",
    rssUrl: "https://www.ynetnews.com/Integration/StoryRss2.xml",
    trustRank: 72,
    countries: ["IL"],
    categories: ["news", "israel"],
  },
  "al-mayadeen": {
    slug: "al-mayadeen",
    name: "Al Mayadeen",
    rssUrl: "https://english.almayadeen.net/rss.xml",
    trustRank: 55,
    countries: ["LB"],
    categories: ["news", "middle-east"],
  },
  "middle-east-eye": {
    slug: "middle-east-eye",
    name: "Middle East Eye",
    rssUrl: "https://www.middleeasteye.net/rss",
    trustRank: 70,
    countries: [],
    categories: ["news", "middle-east"],
  },
  "rudaw": {
    slug: "rudaw",
    name: "Rudaw (Iraq)",
    rssUrl: "https://www.rudaw.net/english/rss",
    trustRank: 68,
    countries: ["IQ"],
    categories: ["news", "iraq", "kurdistan"],
  },
  "kurdistan24": {
    slug: "kurdistan24",
    name: "Kurdistan 24",
    rssUrl: "https://www.kurdistan24.net/en/rss",
    trustRank: 65,
    countries: ["IQ"],
    categories: ["news", "kurdistan"],
  },
  "al-arabiya": {
    slug: "al-arabiya",
    name: "Al Arabiya",
    rssUrl: "https://english.alarabiya.net/rss.xml",
    trustRank: 70,
    countries: ["SA"],
    categories: ["news", "middle-east"],
  },
  "press-tv": {
    slug: "press-tv",
    name: "Press TV",
    rssUrl: "https://www.presstv.ir/rss",
    trustRank: 45,
    countries: ["IR"],
    categories: ["news", "iran"],
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
export { GeoLocation, GEO_LOOKUP, geocodeText };

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
    const geo = await geocodeTextAsync(text, { MAPBOX_ACCESS_TOKEN: (env as Record<string,string>)["MAPBOX_ACCESS_TOKEN"] ?? (env as Record<string,string>)["MAPBOX_TOKEN"] });
    const keywords = extractKeywords(text);
    const category = detectCategory(text);
    const nowMs = Date.now();
    const ageMs = nowMs - publishedAt.getTime();
    const isBreaking = ageMs < 30 * 60 * 1000; // within last 30 minutes

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
        isBreaking,
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
