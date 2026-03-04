-- =============================================================================
-- War Dashboard — Initial Schema Migration
-- Generated: 2026-03-01
-- ORM: Drizzle ORM | DB: Supabase Postgres
-- =============================================================================

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  google_id     TEXT UNIQUE,
  tier          VARCHAR NOT NULL DEFAULT 'individual',  -- 'individual' | 'pro'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- user_preferences
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_preferences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  nationalities   TEXT[] NOT NULL DEFAULT '{}',
  topics          TEXT[] NOT NULL DEFAULT '{}',
  notif_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  branding_logo   TEXT,
  branding_color  TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- pins
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pins (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  lat        DOUBLE PRECISION NOT NULL,
  lng        DOUBLE PRECISION NOT NULL,
  radius_km  DOUBLE PRECISION NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- sources
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sources (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  slug           VARCHAR(64) UNIQUE NOT NULL,
  url            TEXT NOT NULL UNIQUE,
  homepage       TEXT NOT NULL,
  icon_url       TEXT,
  trust_rank     INTEGER NOT NULL DEFAULT 50,
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  last_polled_at TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- alerts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headline         TEXT NOT NULL,
  body             TEXT,
  url              TEXT NOT NULL,
  source_ids       UUID[] NOT NULL DEFAULT '{}',
  category         TEXT,
  country_code     TEXT,
  lat              DOUBLE PRECISION,
  lng              DOUBLE PRECISION,
  geo_precision    TEXT,
  confidence_score DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  is_breaking      BOOLEAN NOT NULL DEFAULT false,
  is_strike        BOOLEAN NOT NULL DEFAULT FALSE,
  published_at     TIMESTAMPTZ NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dedup_hash       TEXT NOT NULL,
  CONSTRAINT alerts_dedup_hash_unique UNIQUE (dedup_hash)
);

-- ---------------------------------------------------------------------------
-- user_alerts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_alerts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_id    UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  is_pinned   BOOLEAN NOT NULL DEFAULT FALSE,
  matched_via TEXT[] NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- strikes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS strikes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id           UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  lat                DOUBLE PRECISION NOT NULL,
  lng                DOUBLE PRECISION NOT NULL,
  location_name      TEXT,
  confirmed_killed   INTEGER NOT NULL DEFAULT 0,
  confirmed_wounded  INTEGER NOT NULL DEFAULT 0,
  occurred_at        TIMESTAMPTZ NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes for common query patterns
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_pins_user_id            ON pins(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_published_at     ON alerts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_country_code     ON alerts(country_code);
CREATE INDEX IF NOT EXISTS idx_alerts_confidence       ON alerts(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_is_breaking      ON alerts(is_breaking) WHERE is_breaking = true;
CREATE INDEX IF NOT EXISTS idx_alerts_is_strike        ON alerts(is_strike) WHERE is_strike = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_alerts_user_id     ON user_alerts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_alerts_alert_id    ON user_alerts(alert_id);
CREATE INDEX IF NOT EXISTS idx_sources_slug            ON sources(slug);
CREATE INDEX IF NOT EXISTS idx_strikes_alert_id        ON strikes(alert_id);
CREATE INDEX IF NOT EXISTS idx_strikes_occurred_at     ON strikes(occurred_at DESC);
