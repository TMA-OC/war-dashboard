# Test Strategy — War News Intelligence Dashboard

**Version:** 1.0  
**Owner:** QA Engineering (Vibe Unit)  
**Last Updated:** 2026-03-01  
**Issues:** Closes #21

---

## 1. Overview

This document defines the test strategy for the War News Intelligence Dashboard — a real-time conflict monitoring platform with AI-powered confidence scoring, pin-based alert matching, and pro broadcast capabilities.

Our goal: ship with confidence. Every critical user path must be covered before merge.

---

## 2. Test Pyramid

```
         /\
        /E2E\         10% — Playwright, critical user journeys
       /------\
      /  Integ  \     20% — API routes, DB queries, SSE streams
     /------------\
    /     Unit      \  70% — Vitest, pure functions, components
   /------------------\
```

| Layer       | % of Tests | Framework         | Scope                                      |
|-------------|-----------|-------------------|--------------------------------------------|
| Unit        | 70%       | Vitest            | Pure functions, Vue components, agents     |
| Integration | 20%       | Vitest + Supertest| API routes, DB layer, SSE, OAuth flows     |
| E2E         | 10%       | Playwright        | Full user journeys in real browser         |

---

## 3. Frameworks & Tooling

### 3.1 Unit Testing — Vitest
- **Backend:** `backend/vitest.config.ts` — tests in `src/**/__tests__/*.test.ts`
- **Frontend:** `frontend/vitest.config.ts` — tests in `src/**/__tests__/*.test.ts`
- Fast, ESM-native, same config as Vite
- Coverage via `@vitest/coverage-v8`

### 3.2 Component Testing — Vue Test Utils
- `@vue/test-utils` for mounting Vue components in isolation
- Mock Pinia stores with `createTestingPinia()`
- Stub router with `createRouter`/`createMemoryHistory`

### 3.3 E2E Testing — Playwright
- Tests in `e2e/` at repo root
- Browsers: Chromium (primary), Firefox (secondary)
- Base URL: `http://localhost:5173`
- Auth state stored in `e2e/fixtures/auth.json` via `storageState`

### 3.4 API Performance — k6
- Load scripts in `perf/` at repo root
- Run in CI on schedule (not every PR)

---

## 4. Critical Paths

### 4.1 Authentication

| Test | Type | Priority |
|------|------|----------|
| Register with email + password | E2E | P0 |
| Login with valid credentials | E2E | P0 |
| Login with invalid credentials shows error | Unit/Integration | P0 |
| Google OAuth redirect flow completes | E2E | P0 |
| Session persists on page refresh | E2E | P1 |
| Logout clears session + redirects | E2E | P0 |
| JWT expiry triggers re-auth | Integration | P1 |
| Rate limiting on /auth/login | Integration | P1 |

### 4.2 Alert Feed

| Test | Type | Priority |
|------|------|----------|
| User sees alerts for pinned country | Integration | P0 |
| User sees alerts matching pinned topic | Integration | P0 |
| User does NOT see alerts outside pins | Integration | P0 |
| Feed filters by confidence threshold | Unit | P1 |
| Feed sorted by newest first | Unit | P1 |

### 4.3 Confidence Scoring

Thresholds:
- >= 0.90 → VERIFIED (green)
- >= 0.70 → LIKELY (yellow)
- >= 0.50 → UNCONFIRMED (orange)
- < 0.50  → RUMOR (red)

### 4.4 Pin Proximity — Haversine distance against pin radius.

### 4.5 RSS Deduplication — Same headline from 2 sources → 1 alert, 2 sources listed.

### 4.6 SSE — New alert pushed to connected client within 5s of ingestion.

### 4.7 Pro Broadcast View — Renders correctly at 1920x1080, branding applied.

### 4.8 Map — Markers render at correct coordinates, clicking shows popup.

---

## 5. Performance Targets

| Metric | Target |
|--------|--------|
| GET /alerts p95 latency | < 200ms |
| Vite production build | < 30s |
| Initial page load (individual dashboard) | < 3s on 4G |
| Map renders 500 markers | No frame drop |

---

## 6. PR Regression Checklist

- [ ] Unit tests added/updated for changed logic
- [ ] Integration tests cover API contract changes
- [ ] `vitest run` passes locally (backend + frontend)
- [ ] Login / register flow still works
- [ ] Confidence scoring thresholds unchanged or re-tested
- [ ] Pin proximity logic unchanged or unit tested
- [ ] RSS deduplication not regressed
- [ ] SSE still pushes within 5s
- [ ] ConfidenceBadge renders correct label + color
- [ ] Broadcast view renders at 1920x1080
- [ ] Map markers and popups work
- [ ] Vite build still < 30s
