import { getDb, type Env } from "../../db/client";
import { sources } from "../../db/schema";
import { eq } from "drizzle-orm";
import { SOURCE_REGISTRY, processRssItems, type RssItem } from "../agents/rssAggregator";
import { matchAlertToUsers } from "../agents/alertMatcher";
import { alerts } from "../../db/schema";
import { desc, gt } from "drizzle-orm";

// Cloudflare Workers compatible RSS fetch (no rss-parser in Workers edge — use manual XML parse)
// We fetch and parse the RSS XML manually using the native DOMParser-like approach.

function parseRssXml(xml: string): RssItem[] {
  const items: RssItem[] = [];

  // Simple regex-based RSS parser for Cloudflare Workers (no DOM APIs for XML)
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1] ?? "";

    const title = extractTag(itemXml, "title");
    const link = extractTag(itemXml, "link");
    const pubDate = extractTag(itemXml, "pubDate");
    const description = extractTag(itemXml, "description");

    if (title && link) {
      items.push({
        title: decodeHtmlEntities(title),
        link,
        pubDate: pubDate ?? new Date().toUTCString(),
        contentSnippet: description ? decodeHtmlEntities(stripTags(description)).slice(0, 500) : undefined,
      });
    }
  }

  return items;
}

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = regex.exec(xml);
  if (!m) return null;
  return (m[1] ?? m[2] ?? "").trim() || null;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
}

export async function pollAllFeeds(env: Env): Promise<{ polled: number; inserted: number }> {
  const db = getDb(env);

  // Sync source registry to DB
  for (const def of Object.values(SOURCE_REGISTRY)) {
    await db
      .insert(sources)
      .values({
        slug: def.slug,
        name: def.name,
        rssUrl: def.rssUrl,
        trustRank: def.trustRank,
        countries: def.countries,
        categories: def.categories,
      })
      .onConflictDoNothing();
  }

  const activeSources = await db.select().from(sources).where(eq(sources.isActive, true));

  let polled = 0;
  let totalInserted = 0;

  for (const src of activeSources) {
    try {
      const res = await fetch(src.rssUrl, {
        headers: { "User-Agent": "WarDashboard/1.0 RSS Bot" },
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) continue;

      const xml = await res.text();
      const items = parseRssXml(xml);

      const def = SOURCE_REGISTRY[src.slug];
      if (!def) continue;

      const inserted = await processRssItems(env, def, { id: src.id, trustRank: src.trustRank }, items);
      totalInserted += inserted;
      polled++;

      // Update last polled time
      await db.update(sources).set({ lastPolledAt: new Date() }).where(eq(sources.id, src.id));
    } catch (err) {
      console.error(`[pollFeeds] Error polling ${src.slug}:`, err);
    }
  }

  // Match newly inserted alerts to users
  if (totalInserted > 0) {
    const newAlerts = await db
      .select()
      .from(alerts)
      .orderBy(desc(alerts.createdAt))
      .limit(totalInserted * 2 + 10);

    for (const alert of newAlerts) {
      await matchAlertToUsers(env, alert).catch((err) => {
        console.error("[pollFeeds] alertMatcher error:", err);
      });
    }
  }

  return { polled, inserted: totalInserted };
}
