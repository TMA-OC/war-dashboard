# ⚔️ War Dashboard

A real-time news intelligence dashboard for the Middle East conflict — built for individual users and broadcast-quality Pro users.

---

## Architecture

```
frontend/          Vue 3 + Vite + TypeScript + Pinia + Vue Router + Mapbox GL JS
backend/           Hono on Cloudflare Workers + Drizzle ORM + Neon PostgreSQL
docker-compose.yml Local PostgreSQL 15 + Redis 7 for development
```

### Auth
- Email/password with JWT (30-day tokens)
- Google OAuth via redirect flow (`/auth/google` → Google → `/auth/google/callback` → frontend `/auth/callback`)
- JWT stored in `localStorage` (`wardash_token`)

### Real-time
- Server-Sent Events (SSE) at `/sse/alerts?token=<JWT>`
- Exponential backoff reconnect in frontend

### RSS Intelligence
- Scheduled Cloudflare Worker cron (`pollFeeds`) — runs every 60–120s
- Geocodes events from article text → coordinates
- Confidence scoring: Wire (0.95) → Major broadcast (0.85) → Major print (0.80) → Regional (0.70) → Partisan (0.60) → Social (0.30)
- Deduplication by semantic hash (title + location + time window)

---

## Local Setup

### Prerequisites
- Node.js 20+
- Docker + Docker Compose
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`)

### 1. Clone and configure

```bash
git clone https://github.com/TMA-OC/war-dashboard.git
cd war-dashboard
cp .env.example .env
# Edit .env with your credentials
```

### 2. Start local services

```bash
docker-compose up -d
# PostgreSQL on :5432, Redis on :6379
```

### 3. Run database migrations

```bash
cd backend
npm install
npx drizzle-kit migrate
npm run seed  # optional: seed initial sources
```

### 4. Start backend (Cloudflare Worker locally)

```bash
cd backend
cp .env.example .env.local
# Edit .env.local
wrangler dev
# Runs on http://localhost:8787
```

### 5. Start frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local
npm run dev
# Runs on http://localhost:5173
```

### 6. Create your account

Visit http://localhost:5173/register and sign up.

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URIs:
   - `http://localhost:8787/auth/google/callback` (dev)
   - `https://war-dashboard-api.your-worker.workers.dev/auth/google/callback` (prod)
4. Copy Client ID and Secret to your `.env`

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
npx vercel --prod
```

The `frontend/vercel.json` is pre-configured.

### Backend → Cloudflare Workers

```bash
cd backend
wrangler secret put DATABASE_URL
wrangler secret put JWT_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put FRONTEND_URL
wrangler secret put MAPBOX_TOKEN
wrangler deploy
```

---

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `DATABASE_URL` | backend | PostgreSQL connection string |
| `JWT_SECRET` | backend | JWT signing secret (min 32 chars) |
| `GOOGLE_CLIENT_ID` | backend | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | backend | Google OAuth client secret |
| `FRONTEND_URL` | backend | Frontend URL for OAuth redirects |
| `MAPBOX_TOKEN` | backend | Mapbox access token |
| `VITE_API_URL` | frontend | Backend API base URL |
| `VITE_MAPBOX_TOKEN` | frontend | Mapbox access token |
| `VITE_GOOGLE_MAPS_KEY` | frontend | Google Maps API key (optional; address search) |

---

## User Tiers

| Tier | Access |
|---|---|
| **Individual** | Personal alert feed, map with pins, radius-based alerts, SSE push |
| **Pro** | Full strikes map, topic feeds, broadcast view, API keys, embeddable widget, data export |

---

## Confidence Score System

| Score | Badge | Meaning |
|---|---|---|
| 90–100% | 🟢 VERIFIED | Confirmed by 3+ major credible sources |
| 70–89% | 🟡 LIKELY | Confirmed by 1–2 credible sources |
| 50–69% | 🟠 UNVERIFIED | From credible source, not yet corroborated |
| <50% | 🔴 RUMOR | Social media / single unverified source |
