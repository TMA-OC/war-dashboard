# User Flow Diagrams — War News Intelligence Dashboard

> Text/ASCII diagrams for all primary user journeys.
> Maintained by Vibe Unit UX Team.

---

## 1. Individual User — Onboarding Flow

**Scenario:** New user registers, sets up their profile, adds a location pin, and sees their first personalized alert.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     INDIVIDUAL USER ONBOARDING FLOW                         │
└─────────────────────────────────────────────────────────────────────────────┘

  [Landing Page]
       │
       │  "Sign Up Free"
       ▼
  ┌────────────────────────────────────┐
  │  STEP 1: Account Registration       │
  │  ─────────────────────────────────  │
  │  • Email + password                 │
  │  • OR: Google/Apple OAuth           │
  │  • Terms & Privacy agreement        │
  └────────────────────────────────────┘
       │
       │  Submit → validation passes
       ▼
  ┌────────────────────────────────────┐
  │  STEP 2: Verify Email               │
  │  ─────────────────────────────────  │
  │  • 6-digit code sent to email       │
  │  • 10-minute expiry                 │
  │  • "Resend code" after 60s          │
  └────────────────────────────────────┘
       │
       │  Code verified ✓
       ▼
  ┌────────────────────────────────────┐
  │  STEP 3: Set Nationality / Context  │
  │  ─────────────────────────────────  │
  │  "Where are you from?"              │
  │                                     │
  │  [🇱🇧 Lebanon]  [🇮🇱 Israel]         │
  │  [🇮🇷 Iran]     [🇺🇦 Ukraine]        │
  │  [Other...]                         │
  │                                     │
  │  ⚠ "This personalizes your alerts   │
  │  and is never shared publicly"      │
  │                                     │
  │  [Skip for now]                     │
  └────────────────────────────────────┘
       │
       │  Selection made (or skipped)
       ▼
  ┌────────────────────────────────────┐
  │  STEP 4: Add Your First Pin         │
  │  ─────────────────────────────────  │
  │  Interactive map shown              │
  │                                     │
  │  "Pin a location you care about"    │
  │  Suggested: Home / Family / Work    │
  │                                     │
  │  [Search: "Beirut, Lebanon" 🔍]     │
  │  OR: [Use my current location 📍]   │
  │                                     │
  │  User clicks/taps on map ──────────►│ PinMarker drops with animate-marker-drop
  │  Popup: "Name this pin"             │
  │  [Home] [Family] [Custom...]        │
  └────────────────────────────────────┘
       │
       │  Pin saved
       ▼
  ┌────────────────────────────────────┐
  │  STEP 5: Choose Alert Topics        │
  │  ─────────────────────────────────  │
  │  Select topics to follow:           │
  │                                     │
  │  [✓] Airstrikes                     │
  │  [✓] Civilian casualties            │
  │  [ ] Naval activity                 │
  │  [ ] Diplomatic                     │
  │  [✓] Missile launches               │
  │  [ ] Ground movements               │
  │  [+ Add custom tag]                 │
  │                                     │
  │  Minimum: 1 topic required          │
  └────────────────────────────────────┘
       │
       │  Topics saved
       ▼
  ┌────────────────────────────────────┐
  │  STEP 6: Notification Preferences   │
  │  ─────────────────────────────────  │
  │  Alert me for:                      │
  │  [✓] Breaking news (immediate)      │
  │  [✓] Events near my pins (<50km)    │
  │  [ ] Daily digest (8 AM local)      │
  │                                     │
  │  Channel: [✓] Browser  [ ] Email   │
  └────────────────────────────────────┘
       │
       │  "Take me to the dashboard"
       ▼
  ┌────────────────────────────────────┐
  │  STEP 7: First Dashboard View       │
  │  ─────────────────────────────────  │
  │  • Map shows pin location           │
  │  • TopicFeed loads relevant alerts  │
  │  • BreakingTicker active            │
  │                                     │
  │  Tooltip overlay:                   │
  │  "← Your pin"                       │
  │  "↑ Live breaking alerts"           │
  │  "→ Filter by topic"                │
  │                                     │
  │  [Dismiss tour]  [Next tip →]       │
  └────────────────────────────────────┘
       │
       ▼
  ✅ ONBOARDING COMPLETE
  User sees: First AlertCard relevant to their pin + topics
```

**Decision branches:**
- If user skips nationality → default to global view
- If user skips pin step → map shows world view; prompt to add pin in sidebar
- If no relevant alerts exist → EmptyFeed component with "Check back soon" message

---

## 2. Pro User — Setup Flow

**Scenario:** Journalist or organization registers for Pro tier, sets up broadcast branding, configures topic monitoring, and accesses broadcast view.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PRO USER SETUP FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

  [Landing Page — Pro Section]
       │
       │  "Start Pro Trial" / "Upgrade to Pro"
       ▼
  ┌────────────────────────────────────┐
  │  STEP 1: Pro Registration           │
  │  ─────────────────────────────────  │
  │  • Organization name (required)     │
  │  • Work email (required)            │
  │  • Role: [Journalist/Editor/Org]    │
  │  • Organization type:               │
  │    ○ News outlet                    │
  │    ○ NGO / Humanitarian             │
  │    ○ Government / Official          │
  │    ○ Research / Academic            │
  │    ○ Individual professional        │
  └────────────────────────────────────┘
       │
       │  Submit → verification email
       ▼
  ┌────────────────────────────────────┐
  │  STEP 2: Plan Selection             │
  │  ─────────────────────────────────  │
  │  Pro Monthly — $X/mo                │
  │  Pro Annual — $Y/yr (save 20%)     │
  │                                     │
  │  Includes:                          │
  │  • Broadcast view + branding        │
  │  • API access                       │
  │  • Priority alert processing        │
  │  • Export to CSV/JSON               │
  │                                     │
  │  [Credit card] [PayPal] [Invoice]   │
  └────────────────────────────────────┘
       │
       │  Payment confirmed
       ▼
  ┌────────────────────────────────────┐
  │  STEP 3: Branding Setup             │
  │  ─────────────────────────────────  │
  │  "Customize your broadcast view"    │
  │                                     │
  │  Organization name: [_________]     │
  │  Logo upload: [Choose file]         │
  │   └─ Recommended: SVG/PNG 200×60px │
  │  Brand accent color: [#______] 🎨  │
  │   └─ Auto-checked for contrast      │
  │                                     │
  │  LIVE PREVIEW →                     │
  │  ┌──────────────────────────────┐   │
  │  │ [LOGO] ORG NAME  ● LIVE      │   │
  │  └──────────────────────────────┘   │
  │                                     │
  │  [Skip — use defaults]              │
  └────────────────────────────────────┘
       │
       │  Branding saved
       ▼
  ┌────────────────────────────────────┐
  │  STEP 4: Topic Tag Configuration    │
  │  ─────────────────────────────────  │
  │  "What will you be covering?"       │
  │                                     │
  │  Pre-set bundles:                   │
  │  [✓] Middle East Conflict           │
  │  [ ] Eastern Europe                 │
  │  [ ] South Asia                     │
  │  [ ] Africa                         │
  │                                     │
  │  Custom tags:                       │
  │  [airstrike] [×]  [civilian] [×]   │
  │  [+ Add tag]                        │
  │                                     │
  │  Alert threshold:                   │
  │  Min confidence: [Likely ▼]        │
  │  (Filters below "likely" from feed) │
  └────────────────────────────────────┘
       │
       │  Topics confirmed
       ▼
  ┌────────────────────────────────────┐
  │  STEP 5: RSS / Source Configuration │
  │  ─────────────────────────────────  │
  │  Default sources are pre-enabled    │
  │                                     │
  │  [✓] Reuters                        │
  │  [✓] Al Jazeera                     │
  │  [✓] BBC Arabic                     │
  │  [+] Add custom RSS feed            │
  │                                     │
  │  Source weighting:                  │
  │  Official govt sources [HIGH]       │
  │  Wire services [HIGH]               │
  │  Social media [LOW]                 │
  └────────────────────────────────────┘
       │
       │  Sources confirmed
       ▼
  ┌────────────────────────────────────┐
  │  STEP 6: Broadcast View Intro       │
  │  ─────────────────────────────────  │
  │  Full-screen broadcast view loads:  │
  │                                     │
  │  BroadcastHeader with org branding  │
  │  BreakingTicker (active)            │
  │  Map with alert markers             │
  │  TopicFeed (right column)           │
  │  CasualtyCounters (left panel)      │
  │                                     │
  │  Tutorial overlay:                  │
  │  "← Your branded header"            │
  │  "↑ Live ticker for your broadcast" │
  │  "→ Share broadcast URL: [copy]"    │
  └────────────────────────────────────┘
       │
       ▼
  ✅ PRO SETUP COMPLETE
  User has: Branded broadcast dashboard + configured topics + API key emailed
```

**Decision branches:**
- No logo uploaded → use org name initials + accent color
- Low-contrast custom color → show warning, suggest correction, allow override
- No custom topics selected → default to global conflict feed

---

## 3. Alert Lifecycle Flow

**Scenario:** How a raw RSS item travels from source ingestion through confidence scoring to appearing in a user's feed.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ALERT LIFECYCLE FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

  [RSS SOURCES]
  Reuters / Al Jazeera / BBC / AP / Telegram channels / Twitter monitors
       │
       │  Polling interval: 30s – 2min per source
       ▼
  ┌────────────────────────────────────┐
  │  INGESTION PIPELINE                 │
  │  ─────────────────────────────────  │
  │  1. Fetch RSS feed                  │
  │  2. Parse XML → normalize fields    │
  │     (title, body, url, pubDate,     │
  │      source, lang)                  │
  │  3. Dedup check (hash of title+url) │
  │  4. Language detection              │
  │  5. Machine translation (if needed) │
  └────────────────────────────────────┘
       │
       │  New, non-duplicate item
       ▼
  ┌────────────────────────────────────┐
  │  NLP / CLASSIFICATION               │
  │  ─────────────────────────────────  │
  │  • Conflict relevance filter        │
  │    (Is this war-related?)           │
  │  • Entity extraction:               │
  │    - Location mentions              │
  │    - Organizations / militaries     │
  │    - Casualty figures               │
  │  • Event type classification:       │
  │    airstrike / missile / ground /   │
  │    naval / diplomatic / humanitarian│
  │  • Severity scoring                 │
  └────────────────────────────────────┘
       │
       ├──── Not conflict-related ────► DISCARD (logged for audit)
       │
       │  Conflict-relevant
       ▼
  ┌────────────────────────────────────┐
  │  GEOCODING                          │
  │  ─────────────────────────────────  │
  │  1. Extract location entities       │
  │  2. Geocode via Nominatim / Google  │
  │  3. Resolve ambiguous places        │
  │     (e.g., "the capital" → context) │
  │  4. Assign confidence radius        │
  │     (city-level vs street-level)    │
  │                                     │
  │  Failed geocode → alert.location    │
  │  = null, no map marker rendered     │
  └────────────────────────────────────┘
       │
       ▼
  ┌────────────────────────────────────┐
  │  CONFIDENCE SCORING ENGINE          │
  │  ─────────────────────────────────  │
  │  Inputs:                            │
  │  • Source reliability score         │
  │    (wire service = 0.9,             │
  │     anon Telegram = 0.2)            │
  │  • Corroboration count              │
  │    (same event, N unique sources)   │
  │  • Recency of publication           │
  │  • Language certainty markers       │
  │    ("reportedly" vs "confirmed")    │
  │  • Official denial presence         │
  │  • Cross-reference with OSINT DB    │
  │                                     │
  │  Output: 0–100 score + tier:        │
  │  90–100 → VERIFIED    ✓             │
  │  65–89  → LIKELY      ~             │
  │  35–64  → UNVERIFIED  !             │
  │  0–34   → RUMOR       ✗             │
  └────────────────────────────────────┘
       │
       ▼
  ┌────────────────────────────────────┐
  │  DEDUPLICATION & CLUSTERING         │
  │  ─────────────────────────────────  │
  │  • Semantic similarity check vs     │
  │    recent alerts (last 6 hours)     │
  │  • Same event from multiple sources │
  │    → merge into one alert, boost    │
  │    confidence score                 │
  │  • New angle on same event →        │
  │    add as "update" to existing      │
  └────────────────────────────────────┘
       │
       ▼
  ┌────────────────────────────────────┐
  │  ALERT RECORD CREATED               │
  │  ─────────────────────────────────  │
  │  Stored in DB with:                 │
  │  • id, headline, body               │
  │  • confidence { tier, score }       │
  │  • location { name, coords, radius }│
  │  • sources: Source[]                │
  │  • topicTags: string[]              │
  │  • severity                         │
  │  • isBreaking (auto-flagged if      │
  │    score > 85 + severity critical)  │
  │  • publishedAt, ingestedAt          │
  └────────────────────────────────────┘
       │
       ▼
  ┌────────────────────────────────────┐
  │  PERSONALIZATION LAYER              │
  │  ─────────────────────────────────  │
  │  For each active user:              │
  │  • Is alert within 100km of a pin?  │
  │  • Does alert match user topics?    │
  │  • Does confidence tier meet        │
  │    user's minimum threshold?        │
  │  • Is alert in user's followed      │
  │    region?                          │
  │                                     │
  │  Match → add to user's feed queue   │
  │  Breaking match → trigger push      │
  │    notification                     │
  └────────────────────────────────────┘
       │
       ▼
  ┌────────────────────────────────────┐
  │  REAL-TIME DELIVERY                 │
  │  ─────────────────────────────────  │
  │  WebSocket broadcast to clients:    │
  │  • TopicFeed receives new alert     │
  │    → slides in at top of list       │
  │  • BreakingTicker (if isBreaking)   │
  │    → prepended to scroll queue      │
  │  • Map marker drops at coordinates  │
  │    (if geocoded) → animate-marker-  │
  │    drop + pulse ring for 10s        │
  │  • Push notification (if subscribed)│
  └────────────────────────────────────┘
       │
       ▼
  ✅ ALERT VISIBLE IN USER FEED

  ─────────────────────────────────────

  POST-PUBLICATION UPDATES:

  ┌────────────────────────────────────┐
  │  CONFIDENCE UPDATES                 │
  │  ─────────────────────────────────  │
  │  As more sources corroborate:       │
  │  rumor → unverified → likely →      │
  │  verified                           │
  │                                     │
  │  ConfidenceBadge updates live in UI │
  │  via WebSocket patch event          │
  └────────────────────────────────────┘

  ┌────────────────────────────────────┐
  │  RETRACTION HANDLING                │
  │  ─────────────────────────────────  │
  │  If original source retracts:       │
  │  • Score forced to 0                │
  │  • Alert marked "RETRACTED"         │
  │  • Map marker removed               │
  │  • Feed card shows retraction notice│
  │  • Push notification: "Update:      │
  │    Earlier report retracted"        │
  └────────────────────────────────────┘
```

---

## Flow Summary Table

| Flow | Steps | Key Decision Points |
|------|-------|---------------------|
| Individual Onboarding | 7 | Skip nationality, skip pin, no relevant alerts |
| Pro Setup | 6 | No logo, contrast fail, no custom topics |
| Alert Lifecycle | 8 stages | Not conflict-related, geocode fail, dupe detection, corroboration |
