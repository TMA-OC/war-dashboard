import { Hono } from "hono";
import { sql } from "drizzle-orm";
import { getDb } from "../../db/client";
import { alerts, userAlerts, strikes } from "../../db/schema";
import { eq, desc, and } from "drizzle-orm";
import { apiKeyMiddleware } from "../middleware/apiKeyAuth";
import type { AppEnv } from "../types";

const exportRouter = new Hono<AppEnv>();

// GET /export/alerts.json — user's alerts as JSON
exportRouter.get("/alerts.json", apiKeyMiddleware, async (c) => {
  const userId = c.get("userId");
  const db = getDb(c.env);

  const rows = await db
    .select({
      id: alerts.id,
      headline: alerts.headline,
      summary: alerts.summary,
      url: alerts.url,
      category: alerts.category,
      topics: alerts.topics,
      keywords: alerts.keywords,
      countryCode: alerts.countryCode,
      locationName: alerts.locationName,
      lat: alerts.lat,
      lng: alerts.lng,
      isBreaking: alerts.isBreaking,
      confidenceScore: alerts.confidenceScore,
      confidenceLabel: alerts.confidenceLabel,
      publishedAt: alerts.publishedAt,
      isRead: userAlerts.isRead,
      isPinned: userAlerts.isPinned,
      matchReason: userAlerts.matchReason,
      deliveredAt: userAlerts.deliveredAt,
    })
    .from(userAlerts)
    .innerJoin(alerts, eq(userAlerts.alertId, alerts.id))
    .where(eq(userAlerts.userId, userId))
    .orderBy(desc(alerts.publishedAt))
    .limit(1000);

  return c.json({ data: rows, count: rows.length, exportedAt: new Date().toISOString() });
});

// GET /export/alerts.csv — user's alerts as CSV
exportRouter.get("/alerts.csv", apiKeyMiddleware, async (c) => {
  const userId = c.get("userId");
  const db = getDb(c.env);

  const rows = await db
    .select({
      id: alerts.id,
      headline: alerts.headline,
      summary: alerts.summary,
      url: alerts.url,
      category: alerts.category,
      countryCode: alerts.countryCode,
      locationName: alerts.locationName,
      lat: alerts.lat,
      lng: alerts.lng,
      isBreaking: alerts.isBreaking,
      confidenceScore: alerts.confidenceScore,
      confidenceLabel: alerts.confidenceLabel,
      publishedAt: alerts.publishedAt,
      isRead: userAlerts.isRead,
      isPinned: userAlerts.isPinned,
    })
    .from(userAlerts)
    .innerJoin(alerts, eq(userAlerts.alertId, alerts.id))
    .where(eq(userAlerts.userId, userId))
    .orderBy(desc(alerts.publishedAt))
    .limit(1000);

  const headers = [
    "id", "headline", "summary", "url", "category", "country_code",
    "location_name", "lat", "lng", "is_breaking", "confidence_score",
    "confidence_label", "published_at", "is_read", "is_pinned",
  ];

  function csvEscape(val: unknown): string {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.id, r.headline, r.summary, r.url, r.category, r.countryCode,
        r.locationName, r.lat, r.lng, r.isBreaking, r.confidenceScore,
        r.confidenceLabel, r.publishedAt?.toISOString(), r.isRead, r.isPinned,
      ]
        .map(csvEscape)
        .join(",")
    ),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="war-dashboard-alerts-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
});

// GET /export/stats.json — war stats snapshot
exportRouter.get("/stats.json", apiKeyMiddleware, async (c) => {
  const db = getDb(c.env);

  const [totalAlerts] = await db
    .select({ count: sql`count(*)::int` })
    .from(alerts);

  const [strikesCount] = await db
    .select({ count: sql`count(*)::int` })
    .from(strikes);

  // Recent breaking alerts
  const breaking = await db
    .select({
      id: alerts.id,
      headline: alerts.headline,
      countryCode: alerts.countryCode,
      publishedAt: alerts.publishedAt,
      confidenceScore: alerts.confidenceScore,
    })
    .from(alerts)
    .where(eq(alerts.isBreaking, true))
    .orderBy(desc(alerts.publishedAt))
    .limit(10);

  // Recent strikes
  const recentStrikes = await db
    .select()
    .from(strikes)
    .orderBy(desc(strikes.publishedAt))
    .limit(10);

  return c.json({
    snapshot: {
      totalAlerts: Number(totalAlerts?.count ?? 0),
      totalStrikes: Number(strikesCount?.count ?? 0),
      breakingAlerts: breaking.length,
      generatedAt: new Date().toISOString(),
    },
    recentBreaking: breaking,
    recentStrikes,
  });
});

// GET /embed/feed — public endpoint for embed widget (no auth)
export const embedFeedRouter = new Hono<AppEnv>();

embedFeedRouter.get("/feed", async (c) => {
  const topic = c.req.query("topic") ?? "";
  const limit = Math.min(Number(c.req.query("limit") ?? 20), 50);
  const db = getDb(c.env);

  const rows = await db
    .select({
      id: alerts.id,
      headline: alerts.headline,
      summary: alerts.summary,
      category: alerts.category,
      countryCode: alerts.countryCode,
      locationName: alerts.locationName,
      isBreaking: alerts.isBreaking,
      confidenceScore: alerts.confidenceScore,
      confidenceLabel: alerts.confidenceLabel,
      publishedAt: alerts.publishedAt,
    })
    .from(alerts)
    .orderBy(desc(alerts.publishedAt))
    .limit(limit);

  // Simple topic filter in JS since topics is a jsonb array
  const filtered = topic
    ? rows.filter((r: any) => {
        // topics column not selected — do a simple headline/category match
        return (
          r.headline.toLowerCase().includes(topic.toLowerCase()) ||
          (r.category && r.category.toLowerCase().includes(topic.toLowerCase()))
        );
      })
    : rows;

  return c.json({ data: filtered });
});

export default exportRouter;
