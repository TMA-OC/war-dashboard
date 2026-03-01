import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  real,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------
export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  googleId: text('google_id').unique(),
  plan: text('plan').notNull().default('free'), // 'free' | 'pro'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// user_preferences
// ---------------------------------------------------------------------------
export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  nationalities: text('nationalities').array().notNull().default(sql`'{}'`),
  topics: text('topics').array().notNull().default(sql`'{}'`),
  notifEnabled: boolean('notif_enabled').notNull().default(false),
  brandingLogo: text('branding_logo'),
  brandingColor: text('branding_color'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// pins
// ---------------------------------------------------------------------------
export const pins = pgTable('pins', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  lat: real('lat').notNull(),
  lng: real('lng').notNull(),
  radiusKm: real('radius_km').notNull().default(50),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// sources
// ---------------------------------------------------------------------------
export const sources = pgTable('sources', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  url: text('url').notNull().unique(), // RSS feed URL
  homepage: text('homepage').notNull(),
  iconUrl: text('icon_url'),
  trustRank: integer('trust_rank').notNull().default(50), // 1–100
  active: boolean('active').notNull().default(true),
  lastPolledAt: timestamp('last_polled_at'),
});

// ---------------------------------------------------------------------------
// alerts
// ---------------------------------------------------------------------------
export const alerts = pgTable(
  'alerts',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    headline: text('headline').notNull(),
    body: text('body'),
    url: text('url').notNull(),
    sourceIds: uuid('source_ids').array().notNull().default(sql`'{}'`),
    category: text('category'), // e.g. 'airstrike', 'ground', 'naval'
    countryCode: text('country_code'),
    lat: real('lat'),
    lng: real('lng'),
    geoPrecision: text('geo_precision'), // 'city' | 'region' | 'country' | 'unknown'
    confidence: real('confidence').notNull().default(0.5), // 0–1
    isBreaking: boolean('is_breaking').notNull().default(false),
    isStrike: boolean('is_strike').notNull().default(false),
    publishedAt: timestamp('published_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    dedupHash: text('dedup_hash').notNull(),
  },
  (t) => ({
    dedupHashUnique: unique().on(t.dedupHash),
  })
);

// ---------------------------------------------------------------------------
// user_alerts
// ---------------------------------------------------------------------------
export const userAlerts = pgTable('user_alerts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  alertId: uuid('alert_id')
    .notNull()
    .references(() => alerts.id, { onDelete: 'cascade' }),
  isRead: boolean('is_read').notNull().default(false),
  isPinned: boolean('is_pinned').notNull().default(false),
  matchedVia: text('matched_via').array().notNull().default(sql`'{}'`), // ['pin:uuid', 'nationality:LB']
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// strikes
// ---------------------------------------------------------------------------
export const strikes = pgTable('strikes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  alertId: uuid('alert_id')
    .notNull()
    .references(() => alerts.id, { onDelete: 'cascade' }),
  lat: real('lat').notNull(),
  lng: real('lng').notNull(),
  locationName: text('location_name'),
  confirmedKilled: integer('confirmed_killed').notNull().default(0),
  confirmedWounded: integer('confirmed_wounded').notNull().default(0),
  occurredAt: timestamp('occurred_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
