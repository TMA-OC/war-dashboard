# PRD: War News Intelligence Dashboard

**Version:** 1.0  
**Status:** Draft  
**Author:** Vibe PM  
**Date:** 2026-03-01  
**GitHub:** https://github.com/TMA-OC/war-dashboard

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Problem Statement](#2-problem-statement)
3. [User Personas](#3-user-personas)
4. [Goals & Success Metrics](#4-goals--success-metrics)
5. [Feature List with Acceptance Criteria](#5-feature-list-with-acceptance-criteria)
6. [Data Model Overview](#6-data-model-overview)
7. [API Contract Overview](#7-api-contract-overview)
8. [Tech Stack](#8-tech-stack)
9. [Out of Scope](#9-out-of-scope)
10. [Test Strategy Overview](#10-test-strategy-overview)
11. [Risks & Dependencies](#11-risks--dependencies)

---

## 1. Product Overview

The **War News Intelligence Dashboard** is a real-time conflict monitoring platform that aggregates, filters, and geo-locates war-related news from RSS feeds worldwide. It delivers actionable intelligence to two distinct user segments:

- **Individual users** who want personalized proximity alerts based on locations they care about (home, family, travel)
- **Pro users** (journalists, security analysts, NGO workers, broadcasters) who need a comprehensive operational picture with branded broadcast capability

The platform continuously polls trusted RSS news sources, applies a war-keyword filter, geocodes events, deduplicates them, and assigns a confidence score to each alert. Users receive alerts via in-app feed, map overlays, and (future) push notifications.

---

## 2. Problem Statement

Conflict monitoring today requires stitching together dozens of news sources, Twitter feeds, and Telegram channels manually. There is no single platform that:

1. Aggregates war-related news intelligently with confidence scoring
2. Lets individuals configure personal pins (home, family locations) and receive proximity alerts
3. Provides a professional broadcast-ready dashboard for media teams
4. Visualises strikes and events on an interactive map in near real-time

This product fills that gap.

---

## 3. User Personas

### 3.1 Individual User ("Alex")

| Attribute | Detail |
|-----------|--------|
| Who | Civilian with family in conflict-adjacent region |
| Goals | Know immediately if something happens near loved ones or personal locations |
| Tech level | Medium — comfortable with apps, not a power user |
| Usage pattern | Checks app 3-5x daily; expects push-style alerts |
| Key pain points | Too much noise, can't filter by location, doesn't know how credible a report is |
| Subscription | Free tier |

**Core needs:**
- Pin specific locations (home, family, work) with custom radius
- See alert feed filtered to those pins + nationality matches
- Confidence badges so they know how reliable a report is
- Map view showing pins and nearby events

### 3.2 Pro User ("Morgan")

| Attribute | Detail |
|-----------|--------|
| Who | Journalist, security analyst, NGO field coordinator, or TV broadcast producer |
| Goals | Real-time operational picture of all active conflict zones; branded output for broadcast |
| Tech level | High — power user, uses multiple screens |
| Usage pattern | Dashboard open all day; needs data panels, ticker, strikes map |
| Key pain points | Can't brand the output, no strike count, hard to share live view |
| Subscription | Paid Pro tier |

**Core needs:**
- Strikes map color-coded by recency
- Casualty counter, topic feed, breaking news ticker
- Branded dashboard (logo, custom colors) for broadcast/screen share
- Full-screen TV-ready layout
- Custom topic tag filtering

---

## 4. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Alert latency | Time from RSS publication to user alert | < 5 minutes |
| Feed accuracy | % of alerts correctly geocoded | > 85% |
| Confidence calibration | Correlation of score with verified events | > 0.75 |
| Individual retention | DAU/MAU ratio | > 40% |
| Pro adoption | Pro conversion from Individual | > 8% |
| Uptime | API + Worker availability | 99.5% |

---

## 5. Feature List with Acceptance Criteria

### F-001 — User Authentication

**Description:** Email/password registration + login, Google OAuth.

**Acceptance Criteria:**
- User can register with email + password (min 8 chars, validated)
- User can log in with email/password and receive a JWT session token
- User can sign in with Google OAuth (token exchange via backend)
- Session persists across page refreshes
- Unauthorized routes redirect to /login
- Logout clears session

**Test Plan:**
- Unit: auth endpoints return correct HTTP codes (200, 401, 409)
- E2E: register > login flow, Google OAuth redirect flow
- Security: rate limit check on login endpoint

---

### F-002 — Individual Dashboard — Alert Feed

**Description:** Personalized alert feed filtered by user's pins, nationalities, and topics.

**Acceptance Criteria:**
- Feed displays alerts sorted by timestamp desc (newest first)
- Each alert card shows: headline, source name + icon, timestamp, confidence badge (0-100), geo tag, category tag
- Confidence badge color: green (>=70), yellow (40-69), red (<40)
- Feed auto-refreshes every 60 seconds or on SSE event
- User can mark alert as read
- User can pin an alert (saved to pinned list)
- Feed filters by: pin proximity, user nationalities, selected topics
- Feed supports infinite scroll (pagination: 20 per page)

**Test Plan:**
- Unit: alert matching logic, confidence scoring
- Integration: feed API returns correct filtered results
- E2E: user sees only alerts relevant to their pins

---

### F-003 — Individual Dashboard — Map View

**Description:** Interactive Mapbox map showing user's pinned locations and nearby alerts/strikes.

**Acceptance Criteria:**
- Map renders via Mapbox GL JS with dark satellite or street basemap
- User's pinned locations shown as custom markers
- Alert events shown as clustered circle markers (color by severity)
- Strike events shown as distinct marker type
- Clicking a marker opens a popup with alert summary
- Map auto-updates when new alerts arrive (SSE-driven)
- Toggle layer controls: Pins | Alerts | Strikes

**Test Plan:**
- Visual regression: map renders markers correctly
- Integration: map data matches feed data
- E2E: click marker > popup > navigate to alert detail

---

### F-004 — Individual Settings

**Description:** User preference management for nationality, pins, alert radius, notification preferences.

**Acceptance Criteria:**
- User can select 1-5 nationalities from a searchable dropdown
- User can add pins via: (a) GPS current location, (b) address search with autofill
- Each pin has: name (custom label), coordinates, alert radius (1-500 km slider)
- User can edit and delete pins (max 10 pins)
- User can select topics of interest from predefined list
- User can toggle in-app notifications on/off
- Settings persist across sessions

**Test Plan:**
- Unit: pin radius calculation, geocoding call
- E2E: add pin via GPS > confirm on map

---

### F-005 — Pro Dashboard — Strikes Map

**Description:** Full conflict zone map with all strike events, color-coded by recency.

**Acceptance Criteria:**
- Map shows all global strike events (not filtered by user pins)
- Strike markers color-coded: red (<1h), orange (1-6h), yellow (6-24h), grey (>24h)
- Hover shows strike summary tooltip
- Click opens detailed panel with all alerts for that location
- Heatmap layer toggle available
- Date range filter (last 1h / 6h / 24h / 7d / custom)
- Map updates in real-time (SSE or 30s polling)

**Test Plan:**
- E2E: filter by 1h -- only red markers visible
- Performance: map renders <1000 markers without frame drop

---

### F-006 — Pro Dashboard — Data Panels

**Description:** Side panels showing casualty counters, topic feed, breaking news ticker.

**Acceptance Criteria:**
- Casualty counter panel: confirmed killed (24h), wounded (24h), updated timestamp
- Topic feed: list of alerts grouped by topic tag, filterable
- Breaking ticker: scrolling horizontal ticker of breaking alerts (confidence >= 85)
- All panels update in real-time

**Test Plan:**
- Unit: casualty aggregation query
- E2E: breaking ticker shows new high-confidence alert within 60s of ingestion

---

### F-007 — Pro Settings + Branding

**Description:** Pro users can brand their dashboard and configure data scope.

**Acceptance Criteria:**
- Upload organisation logo (PNG/SVG, max 2MB) -- stored in object storage
- Set primary brand color (color picker, hex input)
- Brand color applied to: ticker background, header accent, button highlights
- Logo displayed in: dashboard header, broadcast view watermark
- Topic tag management: add/remove/reorder custom topic tags
- Alert source filter: enable/disable specific RSS sources
- Settings stored per user in DB

**Test Plan:**
- E2E: upload logo > see in broadcast view
- Visual: brand color persists after page reload

---

### F-008 — Pro Broadcast View

**Description:** Full-screen, TV-ready layout optimized for screen share or external display.

**Acceptance Criteria:**
- Route: /broadcast -- requires Pro auth
- Full-screen layout with no browser chrome
- Shows: strikes map (large), breaking ticker at bottom, source/time watermark
- Organisation logo and brand color applied
- Auto-advances through active alerts (carousel mode, configurable interval 15-60s)
- Clock showing UTC and local time
- Hotkey: F to toggle fullscreen API
- Works at 1920x1080 and 3840x2160 (4K)

**Test Plan:**
- Visual regression at 1080p and 4K
- E2E: navigate to /broadcast as Pro user > layout renders correctly

---

### F-009 — RSS Aggregator Intelligence Agent

**Description:** Background Worker that polls RSS feeds, filters for war content, geocodes, deduplicates, and scores confidence.

**Acceptance Criteria:**
- Polls all active RSS sources on configurable interval (default: 5 min)
- Applies war-keyword filter (airstrike, missile, casualties, killed, shelling, offensive, ceasefire, invasion, etc.)
- Geocodes each alert using NLP entity extraction + Mapbox Geocoding API
- Deduplicates: same story from multiple sources merged into one alert with source list
- Confidence score algorithm: base score from source trust rank + keyword density + geocode precision
- Stores raw + processed alert in DB
- Emits SSE event to connected clients on new alert
- Error-tolerant: single source failure does not stop other sources

**Test Plan:**
- Unit: keyword filter, dedup logic, confidence scoring algorithm
- Integration: poll mock RSS > correct DB record created
- Load: 50 sources polled concurrently without timeout

---

### F-010 — Per-User Alert Matching Engine

**Description:** When new alerts arrive, match them to users who should receive them.

**Acceptance Criteria:**
- On new alert: check all users' pins for proximity match (Haversine distance <= pin radius)
- Check user nationality match against alert's country tag
- Check topic match against user's selected topics
- If any match: create user_alert record + push SSE event to that user's connection
- Matching runs async (does not block ingestion)
- Matching completes for all users within 30s of alert creation (for <=10k users)

**Test Plan:**
- Unit: Haversine distance calculation
- Integration: insert alert > verify user_alert records created correctly
- Load: 10k user matching in <30s

---

### F-011 — Design System & Component Library

**Description:** Shared UI foundation with Tailwind tokens, reusable Vue components, and Figma reference.

**Acceptance Criteria:**
- Tailwind config defines: color palette, spacing scale, typography scale, border radius tokens
- Component library includes: Button, Badge, Card, Modal, Toast, Dropdown, Map wrapper, Ticker, Spinner, EmptyState
- Each component has: props documented, emits documented
- Dark mode support for all components
- Figma file URL documented in README

**Test Plan:**
- Visual: components render correctly in light and dark mode
- A11y: components pass WCAG 2.1 AA automated checks (axe)

---

## 6. Data Model Overview

### users
```
id              uuid PK
email           text UNIQUE NOT NULL
password_hash   text
google_id       text
plan            enum('individual','pro') DEFAULT 'individual'
created_at      timestamptz
updated_at      timestamptz
```

### user_preferences
```
id              uuid PK
user_id         uuid FK -> users.id
nationalities   text[]
topics          text[]
notif_enabled   boolean DEFAULT true
branding_logo   text
branding_color  text
updated_at      timestamptz
```

### pins
```
id              uuid PK
user_id         uuid FK -> users.id
label           text
lat             float8 NOT NULL
lng             float8 NOT NULL
radius_km       int NOT NULL DEFAULT 50
created_at      timestamptz
```

### sources
```
id              uuid PK
name            text NOT NULL
url             text NOT NULL
homepage        text
icon_url        text
trust_rank      int DEFAULT 50
active          boolean DEFAULT true
last_polled_at  timestamptz
```

### alerts
```
id              uuid PK
headline        text NOT NULL
body            text
url             text
source_ids      uuid[]
category        text
country_code    text
lat             float8
lng             float8
geo_precision   enum('exact','city','country','unknown')
confidence      int
is_breaking     boolean DEFAULT false
is_strike       boolean DEFAULT false
published_at    timestamptz
created_at      timestamptz
dedup_hash      text UNIQUE
```

### user_alerts
```
id              uuid PK
user_id         uuid FK -> users.id
alert_id        uuid FK -> alerts.id
is_read         boolean DEFAULT false
is_pinned       boolean DEFAULT false
matched_via     text[]
created_at      timestamptz
```

### strikes
```
id              uuid PK
alert_id        uuid FK -> alerts.id
lat             float8 NOT NULL
lng             float8 NOT NULL
location_name   text
confirmed_killed int DEFAULT 0
confirmed_wounded int DEFAULT 0
occurred_at     timestamptz
created_at      timestamptz
```

---

## 7. API Contract Overview

**Base URL:** `https://api.war-dashboard.workers.dev`  
**Auth:** Bearer JWT in `Authorization` header

### Auth Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Register with email + password |
| POST | /auth/login | Login, returns JWT |
| POST | /auth/google | Exchange Google OAuth code for JWT |
| POST | /auth/logout | Invalidate session |
| GET | /auth/me | Get current user |

### Alert Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /alerts | Get user's personalized alert feed (paginated) |
| GET | /alerts/global | Get global alert feed (Pro only) |
| GET | /alerts/strikes | Get strike events |
| GET | /alerts/breaking | Get breaking alerts (confidence >= 85) |
| PATCH | /alerts/:id/read | Mark alert as read |
| PATCH | /alerts/:id/pin | Pin/unpin alert |

### Preferences Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /preferences | Get user preferences |
| PUT | /preferences | Update preferences |
| GET | /pins | Get user's pins |
| POST | /pins | Add a pin |
| PUT | /pins/:id | Update a pin |
| DELETE | /pins/:id | Delete a pin |

### SSE

| Method | Path | Description |
|--------|------|-------------|
| GET | /sse/alerts | Server-Sent Events stream for real-time alerts |

### Standard Response Format

```json
{
  "data": {},
  "meta": { "page": 1, "perPage": 20, "total": 412 },
  "error": null
}
```

Error:
```json
{
  "data": null,
  "error": { "code": "UNAUTHORIZED", "message": "Invalid or expired token" }
}
```

---

## 8. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | Vue 3 + Vite + TypeScript |
| UI styling | Tailwind CSS v3 |
| State management | Pinia |
| Routing | Vue Router 4 |
| Maps | Mapbox GL JS |
| Backend runtime | Hono on Cloudflare Workers |
| ORM | Drizzle ORM |
| Database | Supabase / Neon Postgres |
| Auth | Custom JWT (Hono) + Google OAuth |
| File storage | Cloudflare R2 |
| Deployment | Cloudflare Pages (frontend) + Workers (backend) |
| CI/CD | GitHub Actions |
| Real-time | SSE via Hono |
| RSS parsing | rss-parser |
| Geocoding | Mapbox Geocoding API |

---

## 9. Out of Scope (v1.0)

1. Mobile native apps (iOS/Android)
2. Push notifications (FCM/APNS)
3. Twitter/X, Telegram, or social media ingestion
4. User-to-user features (sharing, comments)
5. Payment/billing integration (Pro manually assigned in DB)
6. Historical data export (CSV/PDF)
7. Machine learning models (rule-based scoring only)
8. Multi-language UI (English only)
9. Offline mode / PWA
10. Self-hosted / on-premise deployment

---

## 10. Test Strategy Overview

### Levels

| Level | Framework | Target Coverage |
|-------|-----------|----------------|
| Unit | Vitest | >= 80% for business logic |
| Integration | Vitest + Hono test helpers | All API endpoints |
| E2E | Playwright | Critical user journeys |
| Visual regression | Playwright screenshots | Broadcast view, component library |
| Performance | k6 / autocannon | API p95 < 200ms |

### Critical E2E Journeys
1. Register > Login > See empty feed
2. Add pin > New matching alert appears in feed
3. Pro user > Open broadcast view > Branding applied
4. Google OAuth login flow

### CI Pipeline
```
push -> lint -> type-check -> unit tests -> integration tests -> deploy preview -> E2E -> merge
```

---

## 11. Risks & Dependencies

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Mapbox API rate limits | Medium | High | Cache geocoding results |
| RSS sources go offline | High | Medium | Per-source error handling |
| False positives in keyword filter | High | Medium | Tunable keyword list + confidence dampening |
| Cloudflare Worker CPU limits | Low | High | Offload heavy work to Cron Triggers |
| GDPR / PII (user pins) | Medium | High | Encrypt pins at rest; data deletion endpoint |
| DB connection pool exhaustion | Low | High | pgBouncer / Neon serverless driver |

---

*End of PRD v1.0*
