import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { getDb } from "../../db/client";
import { userPreferences, pins } from "../../db/schema";
import { authMiddleware } from "../middleware/auth";
import type { AppEnv } from "../types";

const prefsRouter = new Hono<AppEnv>();

// GET /preferences
prefsRouter.get("/", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const db = getDb(c.env);

  let [prefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (!prefs) {
    // Auto-create defaults
    [prefs] = await db.insert(userPreferences).values({ userId }).returning();
  }

  return c.json({ data: prefs });
});

// PUT /preferences
prefsRouter.put(
  "/",
  authMiddleware,
  zValidator(
    "json",
    z.object({
      nationalities: z.array(z.string().length(2)).optional(),
      watchedCountries: z.array(z.string().length(2)).optional(),
      topics: z.array(z.string()).optional(),
      brandingLogoUrl: z.string().url().optional().nullable(),
      brandingColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
      brandingOrgName: z.string().max(255).optional().nullable(),
      notificationsEnabled: z.boolean().optional(),
      emailDigestEnabled: z.boolean().optional(),
    })
  ),
  async (c) => {
    const userId = c.get("userId");
    const updates = c.req.valid("json");
    const db = getDb(c.env);

    const updateData: Partial<typeof userPreferences.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (updates.nationalities !== undefined) updateData.nationalities = updates.nationalities;
    if (updates.watchedCountries !== undefined) updateData.watchedCountries = updates.watchedCountries;
    if (updates.topics !== undefined) updateData.topics = updates.topics;
    if (updates.brandingLogoUrl !== undefined) updateData.brandingLogoUrl = updates.brandingLogoUrl;
    if (updates.brandingColor !== undefined) updateData.brandingColor = updates.brandingColor;
    if (updates.brandingOrgName !== undefined) updateData.brandingOrgName = updates.brandingOrgName;
    if (updates.notificationsEnabled !== undefined) updateData.notificationsEnabled = updates.notificationsEnabled;
    if (updates.emailDigestEnabled !== undefined) updateData.emailDigestEnabled = updates.emailDigestEnabled;

    const [updated] = await db
      .update(userPreferences)
      .set(updateData)
      .where(eq(userPreferences.userId, userId))
      .returning();

    if (!updated) {
      // Insert if not exists
      const [created] = await db
        .insert(userPreferences)
        .values({ userId, ...updateData })
        .returning();
      return c.json({ data: created });
    }

    return c.json({ data: updated });
  }
);

// GET /pins
prefsRouter.get("/pins", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const db = getDb(c.env);

  const rows = await db
    .select()
    .from(pins)
    .where(and(eq(pins.userId, userId), eq(pins.isActive, true)));

  return c.json({ data: rows });
});

// POST /pins
prefsRouter.post(
  "/pins",
  authMiddleware,
  zValidator(
    "json",
    z.object({
      label: z.string().min(1).max(255),
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      radiusKm: z.number().min(1).max(500).default(50),
      countryCode: z.string().length(2).optional(),
    })
  ),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = getDb(c.env);

    const [pin] = await db
      .insert(pins)
      .values({ userId, ...body })
      .returning();

    return c.json({ data: pin }, 201);
  }
);

// PUT /pins/:id
prefsRouter.put(
  "/pins/:id",
  authMiddleware,
  zValidator(
    "json",
    z.object({
      label: z.string().min(1).max(255).optional(),
      lat: z.number().min(-90).max(90).optional(),
      lng: z.number().min(-180).max(180).optional(),
      radiusKm: z.number().min(1).max(500).optional(),
      countryCode: z.string().length(2).optional().nullable(),
      isActive: z.boolean().optional(),
    })
  ),
  async (c) => {
    const userId = c.get("userId");
    const pinId = c.req.param("id");
    const body = c.req.valid("json");
    const db = getDb(c.env);

    const [pin] = await db
      .update(pins)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(pins.id, pinId), eq(pins.userId, userId)))
      .returning();

    if (!pin) return c.json({ error: "Not found" }, 404);
    return c.json({ data: pin });
  }
);

// DELETE /pins/:id
prefsRouter.delete("/pins/:id", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const pinId = c.req.param("id");
  const db = getDb(c.env);

  // Soft delete
  const [pin] = await db
    .update(pins)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(pins.id, pinId), eq(pins.userId, userId)))
    .returning();

  if (!pin) return c.json({ error: "Not found" }, 404);
  return c.json({ success: true });
});

export default prefsRouter;
