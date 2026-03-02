import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  real,
  doublePrecision,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }),
    googleId: varchar("google_id", { length: 255 }).unique(),
    displayName: varchar("display_name", { length: 255 }),
    avatarUrl: text("avatar_url"),
    tier: varchar("tier", { length: 32 }).notNull().default("individual"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
    googleIdx: index("users_google_idx").on(t.googleId),
  })
);

export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  nationalities: jsonb("nationalities").$type<string[]>().notNull().default([]),
  watchedCountries: jsonb("watched_countries").$type<string[]>().notNull().default([]),
  topics: jsonb("topics").$type<string[]>().notNull().default([]),
  brandingLogoUrl: text("branding_logo_url"),
  brandingColor: varchar("branding_color", { length: 7 }),
  brandingOrgName: varchar("branding_org_name", { length: 255 }),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  emailDigestEnabled: boolean("email_digest_enabled").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pins = pgTable(
  "pins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 255 }).notNull(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    radiusKm: real("radius_km").notNull().default(50),
    countryCode: varchar("country_code", { length: 2 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({ userIdx: index("pins_user_idx").on(t.userId) })
);

export const sources = pgTable(
  "sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 64 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    rssUrl: text("rss_url").notNull(),
    homepageUrl: text("homepage_url"),
    logoUrl: text("logo_url"),
    trustRank: integer("trust_rank").notNull().default(70),
    countries: jsonb("countries").$type<string[]>().notNull().default([]),
    categories: jsonb("categories").$type<string[]>().notNull().default([]),
    isActive: boolean("is_active").notNull().default(true),
    lastPolledAt: timestamp("last_polled_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({ slugIdx: uniqueIndex("sources_slug_idx").on(t.slug) })
);

export const alerts = pgTable(
  "alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    headline: text("headline").notNull(),
    summary: text("summary"),
    url: text("url").notNull(),
    imageUrl: text("image_url"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    locationName: varchar("location_name", { length: 255 }),
    countryCode: varchar("country_code", { length: 2 }),
    category: varchar("category", { length: 64 }),
    topics: jsonb("topics").$type<string[]>().notNull().default([]),
    keywords: jsonb("keywords").$type<string[]>().notNull().default([]),
    confidenceScore: real("confidence_score").notNull().default(0),
    confidenceLabel: varchar("confidence_label", { length: 16 }).notNull().default("UNVERIFIED"),
    sourceIds: jsonb("source_ids").$type<string[]>().notNull().default([]),
    primarySourceId: uuid("primary_source_id").references(() => sources.id),
    dedupHash: varchar("dedup_hash", { length: 128 }).unique(),
    isBreaking: boolean("is_breaking").notNull().default(false),
    publishedAt: timestamp("published_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    publishedIdx: index("alerts_published_idx").on(t.publishedAt),
    countryIdx: index("alerts_country_idx").on(t.countryCode),
    confidenceIdx: index("alerts_confidence_idx").on(t.confidenceScore),
    dedupIdx: uniqueIndex("alerts_dedup_idx").on(t.dedupHash),
    geoIdx: index("alerts_geo_idx").on(t.lat, t.lng),
  })
);

export const userAlerts = pgTable(
  "user_alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    alertId: uuid("alert_id")
      .notNull()
      .references(() => alerts.id, { onDelete: "cascade" }),
    isRead: boolean("is_read").notNull().default(false),
    isPinned: boolean("is_pinned").notNull().default(false),
    matchReason: varchar("match_reason", { length: 64 }),
    matchedPinId: uuid("matched_pin_id").references(() => pins.id),
    deliveredAt: timestamp("delivered_at").notNull().defaultNow(),
    readAt: timestamp("read_at"),
  },
  (t) => ({
    userIdx: index("user_alerts_user_idx").on(t.userId),
    alertIdx: index("user_alerts_alert_idx").on(t.alertId),
    uniqueUserAlert: uniqueIndex("user_alerts_unique").on(t.userId, t.alertId),
  })
);

export const strikes = pgTable(
  "strikes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    alertId: uuid("alert_id").references(() => alerts.id),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    locationName: varchar("location_name", { length: 255 }),
    countryCode: varchar("country_code", { length: 2 }),
    strikeType: varchar("strike_type", { length: 64 }),
    casualties: integer("casualties"),
    confirmedAt: timestamp("confirmed_at"),
    sourceIds: jsonb("source_ids").$type<string[]>().notNull().default([]),
    confidenceScore: real("confidence_score").notNull().default(0),
    publishedAt: timestamp("published_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    geoIdx: index("strikes_geo_idx").on(t.lat, t.lng),
    publishedIdx: index("strikes_published_idx").on(t.publishedAt),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;
export type Pin = typeof pins.$inferSelect;
export type NewPin = typeof pins.$inferInsert;
export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
export type UserAlert = typeof userAlerts.$inferSelect;
export type NewUserAlert = typeof userAlerts.$inferInsert;
export type Strike = typeof strikes.$inferSelect;
export type NewStrike = typeof strikes.$inferInsert;
