// seed.ts — Seed the sources table with all known RSS sources
// Run via: npx tsx backend/db/seed.ts

import { SOURCE_REGISTRY } from "../src/agents/rssAggregator";

// All source definitions come from the single SOURCE_REGISTRY — this ensures
// seed data is always in sync with the aggregator.

export const SEED_SOURCES = Object.values(SOURCE_REGISTRY).map((src) => ({
  slug: src.slug,
  name: src.name,
  rssUrl: src.rssUrl,
  trustRank: src.trustRank,
  countries: src.countries,
  categories: src.categories,
  isActive: true,
}));

// ─── Seed function (adapt DB client as needed for your environment) ───────────

export async function seedSources(db: any): Promise<void> {
  const { sources } = await import("./schema");
  const { sql } = await import("drizzle-orm");

  console.log(`Seeding ${SEED_SOURCES.length} sources...`);

  for (const source of SEED_SOURCES) {
    await db
      .insert(sources)
      .values(source)
      .onConflictDoUpdate({
        target: sources.slug,
        set: {
          name: source.name,
          rssUrl: source.rssUrl,
          trustRank: source.trustRank,
          countries: source.countries,
          categories: source.categories,
          isActive: true,
        },
      });
    console.log(`  ✅ ${source.slug}`);
  }

  console.log("Seed complete.");
}

// Preview — run directly with: npx tsx backend/db/seed.ts --preview
// console.log(`Total sources: ${SEED_SOURCES.length}`);
