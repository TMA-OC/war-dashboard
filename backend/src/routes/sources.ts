import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and, inArray, desc, sql } from "drizzle-orm";
import { getDb } from "../../db/client";
import { sources } from "../../db/schema";
import { authMiddleware } from "../middleware/auth";
import type { AppEnv } from "../types";

const sourcesRouter = new Hono<AppEnv>();

// GET /sources — list all sources with optional filters
sourcesRouter.get(
  "/",
  authMiddleware,
  zValidator(
    "query",
    z.object({
      country: z.string().length(2).optional(),
      category: z.string().optional(),
      minTrust: z.coerce.number().min(0).max(100).optional(),
      activeOnly: z.coerce.boolean().default(true),
    })
  ),
  async (c) => {
    const { country, category, minTrust, activeOnly } = c.req.valid("query");
    const db = getDb(c.env);

    let query = db.select().from(sources).$dynamic();

    const conditions = [];
    if (activeOnly) {
      conditions.push(eq(sources.isActive, true));
    }
    if (minTrust !== undefined) {
      conditions.push(sql`${sources.trustRank} >= ${minTrust}`);
    }

    // Build query with conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const rows = await query.orderBy(desc(sources.trustRank));

    // Filter by country/category in JS (jsonb arrays)
    let filtered = rows;
    if (country) {
      filtered = filtered.filter((s) =>
        s.countries.some((c) => c.toLowerCase() === country.toLowerCase())
      );
    }
    if (category) {
      filtered = filtered.filter((s) =>
        s.categories.some((c) => c.toLowerCase().includes(category.toLowerCase()))
      );
    }

    return c.json({
      data: filtered.map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        homepageUrl: s.homepageUrl,
        logoUrl: s.logoUrl,
        trustRank: s.trustRank,
        countries: s.countries,
        categories: s.categories,
        lastPolledAt: s.lastPolledAt,
      })),
      total: filtered.length,
    });
  }
);

// GET /sources/:id — single source details
sourcesRouter.get("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const db = getDb(c.env);

  const [source] = await db.select().from(sources).where(eq(sources.id, id)).limit(1);

  if (!source) {
    return c.json({ error: "Source not found" }, 404);
  }

  return c.json({ data: source });
});

// GET /sources/tiers — get sources grouped by credibility tier
sourcesRouter.get("/by/tiers", authMiddleware, async (c) => {
  const db = getDb(c.env);
  const rows = await db
    .select()
    .from(sources)
    .where(eq(sources.isActive, true))
    .orderBy(desc(sources.trustRank));

  // Group by trust rank tiers
  const tiers = {
    tier1: rows.filter((s) => s.trustRank >= 90), // Wire services
    tier2: rows.filter((s) => s.trustRank >= 80 && s.trustRank < 90), // Major broadcast
    tier3: rows.filter((s) => s.trustRank >= 70 && s.trustRank < 80), // Major print
    tier4: rows.filter((s) => s.trustRank >= 60 && s.trustRank < 70), // Regional credible
    tier5: rows.filter((s) => s.trustRank >= 50 && s.trustRank < 60), // Partisan credible
    tier6: rows.filter((s) => s.trustRank >= 40 && s.trustRank < 50), // Social/aggregator
    tier7: rows.filter((s) => s.trustRank < 40), // Unverified
  };

  return c.json({ data: tiers });
});

export default sourcesRouter;
