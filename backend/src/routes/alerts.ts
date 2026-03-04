import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { getDb } from "../../db/client";
import { alerts, userAlerts, strikes } from "../../db/schema";
import { authMiddleware, proMiddleware } from "../middleware/auth";
import type { AppEnv } from "../types";

const alertsRouter = new Hono<AppEnv>();

// GET /alerts — user's personalized feed
alertsRouter.get(
  "/",
  authMiddleware,
  zValidator(
    "query",
    z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
      unreadOnly: z.coerce.boolean().default(false),
      pinnedOnly: z.coerce.boolean().default(false),
    })
  ),
  async (c) => {
    const userId = c.get("userId");
    const { page, limit, unreadOnly, pinnedOnly } = c.req.valid("query");
    const db = getDb(c.env);
    const offset = (page - 1) * limit;

    const conditions = [eq(userAlerts.userId, userId)];
    if (unreadOnly) conditions.push(eq(userAlerts.isRead, false));
    if (pinnedOnly) conditions.push(eq(userAlerts.isPinned, true));

    const rows = await db
      .select({
        userAlertId: userAlerts.id,
        isRead: userAlerts.isRead,
        isPinned: userAlerts.isPinned,
        matchReason: userAlerts.matchReason,
        deliveredAt: userAlerts.deliveredAt,
        alert: alerts,
      })
      .from(userAlerts)
      .innerJoin(alerts, eq(userAlerts.alertId, alerts.id))
      .where(and(...conditions))
      .orderBy(desc(alerts.publishedAt))
      .limit(limit)
      .offset(offset);

    return c.json({ data: rows, page, limit });
  }
);

// GET /alerts/global — all alerts (Pro)
alertsRouter.get("/global", authMiddleware, proMiddleware,
  zValidator(
    "query",
    z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
      countryCode: z.string().length(2).optional(),
      category: z.string().optional(),
    })
  ),
  async (c) => {
    const { page, limit, countryCode, category } = c.req.valid("query");
    const db = getDb(c.env);
    const offset = (page - 1) * limit;

    const conditions = [];
    if (countryCode) conditions.push(eq(alerts.countryCode, countryCode));
    if (category) conditions.push(eq(alerts.category, category));

    const rows = await db
      .select()
      .from(alerts)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(alerts.publishedAt))
      .limit(limit)
      .offset(offset);

    return c.json({ data: rows, page, limit });
  }
);

// GET /alerts/strikes — strike events for map
alertsRouter.get("/strikes", authMiddleware, async (c) => {
  const db = getDb(c.env);
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // last 7 days

  const rows = await db
    .select()
    .from(strikes)
    .where(gte(strikes.publishedAt, since))
    .orderBy(desc(strikes.publishedAt))
    .limit(500);

  return c.json({ data: rows });
});

// GET /alerts/breaking — confidence >= 85, last 6h
alertsRouter.get("/breaking", authMiddleware, async (c) => {
  const db = getDb(c.env);
  const since = new Date(Date.now() - 6 * 60 * 60 * 1000);

  const rows = await db
    .select()
    .from(alerts)
    .where(and(gte(alerts.publishedAt, since), gte(alerts.confidenceScore, 0.85)))
    .orderBy(desc(alerts.publishedAt))
    .limit(50);

  return c.json({ data: rows });
});

// PATCH /alerts/:id/read
alertsRouter.patch(
  "/:id/read",
  authMiddleware,
  async (c) => {
    const userId = c.get("userId");
    const alertId = c.req.param("id");
    const db = getDb(c.env);

    const [row] = await db
      .update(userAlerts)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(userAlerts.userId, userId), eq(userAlerts.alertId, alertId)))
      .returning();

    if (!row) return c.json({ error: "Not found" }, 404);
    return c.json({ success: true, data: row });
  }
);

// PATCH /alerts/:id/pin
alertsRouter.patch(
  "/:id/pin",
  authMiddleware,
  zValidator("json", z.object({ pinned: z.boolean() })),
  async (c) => {
    const userId = c.get("userId");
    const alertId = c.req.param("id");
    const { pinned } = c.req.valid("json");
    const db = getDb(c.env);

    const [row] = await db
      .update(userAlerts)
      .set({ isPinned: pinned })
      .where(and(eq(userAlerts.userId, userId), eq(userAlerts.alertId, alertId)))
      .returning();

    if (!row) return c.json({ error: "Not found" }, 404);
    return c.json({ success: true, data: row });
  }
);

export default alertsRouter;
