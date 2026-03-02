# ⚔️ War News Intelligence Dashboard

Real-time war news intelligence platform for journalists, analysts, and broadcasters. Individual feed + Pro TV dashboard.

## Architecture

```
war-dashboard/
├── backend/          # Hono API — Cloudflare Worker
│   ├── db/           # Drizzle ORM schema + Neon Postgres
│   └── src/
│       ├── routes/   # /auth /alerts /preferences /sse
│       ├── agents/   # rssAggregator, confidenceScorer, alertMatcher, sourceSelector
│       └── cron/     # RSS poll every 2 minutes
└── frontend/         # Next.js 14 App Router
    └── src/
        ├── app/      # Pages: /login /register /dashboard /pro
        ├── components/
        └── hooks/    # useSSE (real-time EventSource)
```

## Stack

| Layer | Tech |
|-------|------|
| Backend | Hono + Cloudflare Workers |
| DB | Drizzle ORM + Neon Postgres |
| Frontend | Next.js 14 + TypeScript |
| Styling | Tailwind CSS |
| Auth | NextAuth.js (Google OAuth + credentials) |
| Data | TanStack Query (React Query) |
| Maps | Leaflet + OpenStreetMap (dark tiles for Pro) |
| Real-time | Server-Sent Events (SSE) |
| Deployment | Backend: Cloudflare Workers · Frontend: Vercel |

## Setup

### Backend (Cloudflare Worker)

```bash
cd backend
npm install
# Set secrets
wrangler secret put DATABASE_URL
wrangler secret put JWT_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
# Deploy
wrangler deploy
```

Backend is live at: `https://war-dashboard-api.the-models-aigency.workers.dev`

### Frontend (Next.js)

```bash
cd frontend
npm install --legacy-peer-deps
cp .env.example .env.local
# Edit .env.local with your values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables (frontend)

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `NEXTAUTH_SECRET` | Random string for session signing |
| `NEXTAUTH_URL` | Frontend base URL |
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Optional Mapbox token (falls back to OSM) |

## Pages

### Individual Dashboard (`/dashboard`)
- **Feed** — Real-time alert feed with confidence badges (🟢 VERIFIED / 🟡 LIKELY / 🟠 UNVERIFIED / 🔴 RUMOR)
- **Map** — Leaflet map with pinned locations and alert markers
- **Settings** — Nationalities, pin locations, notification preferences

### Pro Dashboard (`/pro`)
- **Breaking ticker** — TV-style chyron at top with live breaking news
- **Strikes map** — Dark tile Leaflet map, color-coded markers by recency
- **Timeline** — Chronological event timeline with confidence indicators
- **Stats** — Confirmed strikes, days of conflict, source count
- **Topic feed** — Right sidebar filtered by category
- **Fullscreen mode** — Press fullscreen button for TV display

### Auth
- `/login` — Email/password or Google OAuth
- `/register` — Account creation

## Database Schema

- **users** — Auth, tier (individual/pro)
- **userPreferences** — Nationalities, topics, branding, notification settings
- **pins** — User-saved locations with radius
- **alerts** — News intelligence items with confidence scoring
- **strikes** — Confirmed military strikes with geo data
- **sources** — RSS sources with trust rankings
- **userAlerts** — User-specific alert delivery tracking

## Deployment

### Vercel (Frontend)

```bash
cd frontend
vercel --prod
```

Set environment variables in Vercel dashboard matching `.env.example`.

### Cloudflare Workers (Backend)

```bash
cd backend
wrangler deploy
```

## License

Private — Vibe Agency / TMA-OC
