# Local Dev Setup Runbook — War News Intelligence Dashboard

**Closes #22**

---

## Prerequisites

- **Node.js 20+** — check: `node --version`
- **npm 10+** — check: `npm --version`
- **Git** — check: `git --version`
- **Wrangler CLI** (for Cloudflare Workers backend) — `npm install -g wrangler`

---

## 1. Clone & Install

```bash
git clone https://github.com/TMA-OC/war-dashboard.git
cd war-dashboard

# Install frontend deps
cd frontend && npm install && cd ..

# Install backend deps
cd backend && npm install && cd ..
```

---

## 2. Environment Setup

### Frontend — `frontend/.env.local`

```env
VITE_API_URL=http://localhost:8787
VITE_MAPBOX_TOKEN=your_mapbox_token
VITE_GOOGLE_MAPS_KEY=your_google_maps_key
```

- Get a free Mapbox token at https://mapbox.com (required for map view)
- Google Maps key optional (used for geocoding only)

### Backend — `backend/.env`

```env
DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
JWT_SECRET=any-random-32-char-string-here
FRONTEND_URL=http://localhost:5173
```

Generate a JWT secret: `openssl rand -hex 16`

---

## 3. Database Setup (Supabase — Free Tier)

1. Create account at https://supabase.com
2. New project → choose region closest to you → set password
3. Go to **Settings → Database → Connection String** → copy the URI
4. Paste into `backend/.env` as `DATABASE_URL`
5. Run migrations and seed:

```bash
cd backend
npm run db:migrate
npm run db:seed
```

---

## 4. Start Dev Servers

Open two terminals:

```bash
# Terminal 1 — Backend (Cloudflare Workers dev)
cd backend && npx wrangler dev
# Runs on http://localhost:8787
```

```bash
# Terminal 2 — Frontend (Vite dev server)
cd frontend && npm run dev
# Runs on http://localhost:5173
```

---

## 5. First Run

1. Open http://localhost:5173
2. Click **Register**
3. Enter any email + password (8+ characters)
4. You'll land on your dashboard
5. Add a pin (country/region) to start seeing alerts

---

## 6. Running Tests

```bash
# Backend unit tests
cd backend && npm test

# Backend watch mode
cd backend && npm run test:watch

# Frontend unit tests
cd frontend && npm run test:unit

# E2E (Playwright) — requires both servers running
npx playwright test
```

---

## 7. Common Issues

### `wrangler dev` fails — "Not authenticated"
```bash
npx wrangler login
# Follow browser OAuth flow
```

### Database connection refused
- Check your `DATABASE_URL` is correct (copy fresh from Supabase)
- Ensure your IP isn't blocked — Supabase → Settings → Database → Connection Pooling

### `VITE_API_URL` requests failing (CORS)
- Verify `FRONTEND_URL=http://localhost:5173` is set in `backend/.env`
- Restart `wrangler dev` after `.env` changes

### Port already in use
```bash
# Kill whatever is on 8787
lsof -ti:8787 | xargs kill -9
# Kill whatever is on 5173
lsof -ti:5173 | xargs kill -9
```

### Google OAuth not working locally
- Add `http://localhost:5173/auth/callback` to your Google OAuth app's redirect URIs
- This requires a Google Cloud project — see backend README for setup

---

## 8. Useful Commands

```bash
# Reset database
cd backend && npm run db:reset

# Build frontend for production
cd frontend && npm run build

# Preview production build
cd frontend && npm run preview

# Type check
cd frontend && npm run type-check
cd backend && npm run type-check
```
