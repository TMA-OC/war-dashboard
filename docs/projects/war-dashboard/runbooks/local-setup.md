# Local Setup Runbook — War Dashboard

This guide gets a local development environment running from scratch.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 20 | [nodejs.org](https://nodejs.org) |
| npm | ≥ 10 | bundled with Node |
| Git | any | [git-scm.com](https://git-scm.com) |
| Wrangler CLI | ≥ 3 | `npm i -g wrangler` |

---

## 1. Clone & Install

```bash
git clone https://github.com/TMA-OC/war-dashboard.git
cd war-dashboard

# Frontend
cd frontend && npm install && cd ..

# Backend
cd backend && npm install && cd ..
```

---

## 2. Supabase Setup

### 2.1 Create a free Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New Project** → fill in name (`war-dashboard`), password, and region.
3. Wait ~2 minutes for provisioning.

### 2.2 Get the connection string

1. In your project dashboard → **Settings → Database**.
2. Under **Connection string → URI**, copy the string.
3. It looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.<ref>.supabase.co:5432/postgres
   ```

### 2.3 Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set:
```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.<ref>.supabase.co:5432/postgres?sslmode=require
```

### 2.4 Run the initial migration

Option A — Drizzle push (quick for dev):
```bash
cd backend
npx drizzle-kit push
```

Option B — Run the SQL migration manually in Supabase SQL editor:
```bash
cat backend/db/migrations/0000_initial_schema.sql
# paste into Supabase → SQL Editor → Run
```

### 2.5 Seed news sources

```bash
cd backend
npx tsx db/seed.ts
```

This inserts 23 news sources (Reuters, AP, BBC, Al Jazeera, etc.).

---

## 3. Run locally

### Frontend (Vite dev server)

```bash
cd frontend
npm run dev
# → http://localhost:5173
```

### Backend (Wrangler local dev)

```bash
cd backend
# Set secrets for local dev:
echo "DATABASE_URL=<your-connection-string>" > .dev.vars
npx wrangler dev
# → http://localhost:8787
```

---

## 4. Verify

- `GET http://localhost:8787/health` → `{ "ok": true }`
- `GET http://localhost:8787/api/sources` → list of 23 seeded sources

---

## 5. Required GitHub Secrets (for CI/CD)

Add these in **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Where to get it |
|--------|----------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → My Profile → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → right sidebar on any page |
| `CF_PAGES_PROJECT_NAME` | Name of your Pages project (e.g. `war-dashboard`) |
| `VITE_API_URL_PREVIEW` | Workers preview URL |
| `VITE_API_URL_PROD` | Workers production URL |

> **Note:** `DATABASE_URL` and `JWT_SECRET` are set as **Wrangler secrets** (not GitHub secrets):
> ```bash
> wrangler secret put DATABASE_URL
> wrangler secret put JWT_SECRET
> ```

---

## 6. Cloudflare Pages Project Setup (Jay to complete)

1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Pages → Create a project → Connect to Git**
3. Select `TMA-OC/war-dashboard`
4. Build settings:
   - **Framework preset:** Vue
   - **Build command:** `cd frontend && npm run build`
   - **Build output directory:** `frontend/dist`
5. Add environment variable: `VITE_API_URL` → Workers URL
6. Copy the `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` to GitHub secrets (see §5)

---

## 7. Troubleshooting

| Issue | Fix |
|-------|-----|
| `DATABASE_URL not set` | Check `.env` or `.dev.vars` |
| Supabase SSL error | Add `?sslmode=require` to connection string |
| Wrangler auth error | Run `wrangler login` |
| Migration already exists | Safe to re-run with `IF NOT EXISTS` guards |
