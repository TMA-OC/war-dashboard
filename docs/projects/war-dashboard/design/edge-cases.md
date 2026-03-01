# Edge Cases & Empty States — War News Intelligence Dashboard

> Defines what users see when things go wrong, are empty, or behave unexpectedly.
> Every edge case has: trigger condition, user impact, UI response, and copy.
> Maintained by Vibe Unit UX Team.

---

## 1. No Alerts Yet (New User / Empty Feed)

### Trigger Conditions
- New user completes onboarding but no alerts match their topics/pins yet
- User applies very narrow filters that match 0 alerts
- User's monitored region is currently quiet

### User Impact
- Confusion ("Is this working?")
- Anxiety ("Are my pins set correctly?")
- Possible churn if not handled warmly

### UI Response

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              🌐                                         │
│        (radar/satellite icon, muted)                    │
│                                                         │
│   "No alerts for your feed yet"                         │
│   ─────────────────────────────                         │
│   The system is monitoring your regions and topics.     │
│   Alerts will appear here as they're detected.         │
│                                                         │
│   Your setup:                                           │
│   📍 2 pins  •  🏷 4 topics  •  ⏱ Live monitoring     │
│                                                         │
│   [Adjust Filters]    [Add More Pins]                   │
│                                                         │
│   Last checked: just now                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Design notes:**
- Icon: neutral, not alarming — radar sweep or globe
- Copy: reassuring, not apologetic
- Show user's current configuration so they can verify it's correct
- "Last checked" timestamp updates every 30s to show system is alive
- Subtle pulsing dot next to "Live monitoring" to show activity

**State variant — filters too narrow:**
```
"No alerts match your current filters"
[× airstrike] [× verified only] ← active filters shown
"Try removing some filters to see more alerts."
[Clear All Filters]
```

---

## 2. No Location Data on Alert (Can't Geocode)

### Trigger Conditions
- NLP extracts no location entities from alert text
- Location extracted but cannot be resolved (too vague: "the region", "northern areas")
- Geocoding API timeout or failure
- Location is at sea / contested zone with no address

### User Impact
- Alert can't be shown on map
- User may miss it if they're primarily using map view

### UI Response

**In AlertCard:**
```
📍 Location not specified
```
- Uses `text-text-muted italic` styling
- No map pin icon (replaced with `?` icon or no icon)
- Card still shown fully in TopicFeed

**In MapPopup / Map view:**
- No marker placed for this alert
- Alert appears ONLY in feed
- If alert is otherwise high confidence + severity, show banner:
```
⚠ 1 high-severity alert has no location data — view in feed →
```

**In detail panel:**
```
┌────────────────────────────────────────────┐
│  📍 Location                               │
│  ────────────────────────────────────────  │
│  Location data unavailable for this alert. │
│  The original report did not specify a     │
│  precise location.                         │
│                                            │
│  Mentioned area: "northern region"  ← raw │
└────────────────────────────────────────────┘
```

**Design notes:**
- Never show the map section if no coordinates available
- Show raw location text if extracted (even if not geocoded)
- No error state — this is expected; just absent data

---

## 3. All RSS Sources Down

### Trigger Conditions
- Network outage affecting all feed fetchers
- All source APIs return 4xx/5xx
- Feed parsing failures across the board
- Upstream RSS format change breaking all parsers

### User Impact
- No new alerts coming in
- Feed looks stale
- User may think the dashboard is broken

### UI Response

**System-wide banner (highest priority, below ticker):**
```
┌────────────────────────────────────────────────────────────────────────────┐
│  ⚠  FEED DISRUPTION  │  Unable to fetch from sources. Showing cached data. │
│  Investigating...  •  Last update: 47 min ago          [Status Page →]     │
└────────────────────────────────────────────────────────────────────────────┘
```
- Banner: `bg-war-yellow/10 border-b border-war-yellow/30 text-war-yellow`
- Always visible, not dismissable during outage
- Automatically hides when feeds recover

**Feed footer:**
```
Showing cached alerts from 47 min ago
[Retry now]
```

**BreakingTicker:**
- Shows last known breaking alerts with timestamp
- Adds "(cached)" label after items

**If outage > 2 hours:**
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│          ⚡ Extended service disruption                  │
│                                                         │
│  We've been unable to reach news sources for 2+ hours. │
│  Our team is aware and working on a fix.               │
│                                                         │
│  Cached alerts shown below (as of 2h ago).             │
│                                                         │
│  [Check Status Page]  [Subscribe to updates]           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Partial outage (some sources down):**
- No user-facing banner unless >50% of sources are down
- Source health indicators in admin panel
- SourceIcon in AlertCard shows degraded state for affected sources

---

## 4. Confidence 0% Edge Case

### Trigger Conditions
- Alert ingested from low-quality source (anon Telegram, obscure account)
- No corroboration found
- Scoring engine returns 0 (not enough data to score)
- Actively contested / known misinformation flag

### User Impact
- Should not pollute the feed for users who want quality information
- But might be important to surface for researchers / pro users

### UI Response

**ConfidenceBadge:**
```
[ ✗ UNSCORED ]  ← not "0%"; badge uses rumor styling
```
- Score of 0 displays as "?" not "0%"
- Tooltip: "This report has not been verified by any reliable source."

**AlertCard:**
- Shown with maximum muted styling
- Additional visual indicator: dashed border instead of solid
- Class: `border-dashed border-war-red/40`
- Small tooltip on hover: "Treat with extreme caution — no verification"

**TopicFeed default behavior:**
- 0% confidence alerts are hidden by default for standard users
- Shown only if user explicitly sets filter to "Show all including rumors"
- Pro users: see them with clear "UNSCORED" label

**Filter UI:**
```
Minimum confidence: [Likely ▼]
                    ○ Verified
                    ○ Likely (default)
                    ○ Unverified
                    ● Show all (including rumors)
```

**When 0% alert is the ONLY relevant alert:**
```
┌─────────────────────────────────────────────────────────┐
│  ⚠ 1 unverified report matches your feed               │
│  Hidden by your confidence filter.                      │
│  [Show anyway]  [Adjust filter]                         │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Broadcast View When No Breaking News

### Trigger Conditions
- Pro broadcast view is active
- No alerts are flagged as `isBreaking = true`
- All active alerts are below "breaking" threshold (confidence < 85 or severity < high)

### User Impact
- BroadcastHeader shows LIVE but ticker has nothing urgent
- Potentially misleading for news channel use

### UI Response

**BreakingTicker — empty state:**
```
● MONITORING  │  No breaking alerts at this time  •  Last updated: 2 min ago
```
- Replace "LIVE" dot with "MONITORING" label
- Change dot from `animate-breaking` (red pulse) to static green dot
- Ticker scrolls slowly with "All quiet" message
- Shows timestamp of last check

**BroadcastHeader:**
- Live status badge changes to amber "MONITORING" instead of red "LIVE"
- Alert count shows total alerts (not just breaking)

**Full broadcast screen:**
```
┌──────────────────────────────────────────────────────────────────┐
│  [ORG LOGO]  ORG NAME        MIDDLE EAST   🟡 MONITORING  14:23  │
│  ● MONITORING │  No breaking alerts · All sources active · 23 alerts tracked │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [MAP: alert markers visible, no new pulses]                     │
│                                                                  │
│  RECENT ALERTS (last 24h):                                       │
│  [AlertCard]                                                     │
│  [AlertCard]                                                     │
│  [AlertCard]                                                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Pro tip shown (first occurrence):**
```
💡 When new breaking alerts are detected, this view switches to live 
broadcast mode automatically.
```

---

## 6. Map with 0 Pins

### Trigger Conditions
- New user hasn't added any pins yet
- User deleted all their pins
- User is viewing another user's shared broadcast (no pins in that context)

### User Impact
- Map looks empty/useless
- User may not know what pins do
- Missed engagement opportunity

### UI Response

**Sidebar prompt (new user, pre-onboarding):**
```
┌──────────────────────────────────────┐
│  📍 Add a location to monitor        │
│  ────────────────────────────────    │
│  Pin places you care about.          │
│  Get alerted when events happen      │
│  nearby.                             │
│                                      │
│  [+ Add Your First Pin]              │
└──────────────────────────────────────┘
```

**Map overlay (if no pins and no strike markers either):**
```
Click anywhere on the map to add a pin
```
- Subtle hint text, centered, fades after 5 seconds
- Only shown once per session

**Map tooltip on hover:**
- Empty map area cursor: `cursor-crosshair`
- Hover tooltip: "Click to add a pin here"

**Post-deletion (all pins removed):**
- Toast notification: "Pin removed. [Undo]" (5s timer)
- If last pin: sidebar prompts to add new pin

**Sidebar when 0 pins:**
```
┌──────────────────────────────────────┐
│  MY PINS  (0)                        │
│  ─────────────────────────────────── │
│                                      │
│  No pins yet.                        │
│  Click the map or search a location  │
│  to add your first pin.              │
│                                      │
│  [🔍 Search location]                │
│  [📍 Use my location]                │
└──────────────────────────────────────┘
```

**Map still shows:**
- Strike markers (events still visible, just no user pins)
- Regional context markers
- Zoom level appropriate to monitored region
- NOT a blank map — region context is always shown

---

## 7. Additional Edge Cases

### Stale Data (Feed not updating)

**Trigger:** WebSocket disconnected, user offline, or server-side issue

```
┌──────────────────────────────────────────────────────────┐
│  ⟳ Reconnecting...   Feed may be outdated (3 min ago)  │
└──────────────────────────────────────────────────────────┘
```
- Subtle banner at top of feed
- Auto-reconnect with exponential backoff
- Disappears on reconnection

### User Scrolled Up (Unread New Alerts)

**Trigger:** New alerts arrive while user is scrolled down in feed

```
┌────────────────────────────────────────┐
│  ↑ 3 new alerts  [Click to refresh]   │
└────────────────────────────────────────┘
```
- Sticky at top of TopicFeed
- Shows count of new unread alerts
- Clicking scrolls to top and loads new items

### Alert Retracted After Being Read

**Trigger:** Source issues correction/retraction after alert published

- AlertCard: red "RETRACTED" overlay badge
- Card grayed out (opacity 50%)
- Tooltip: "This report was retracted by the original source"
- Map marker (if present): removed
- If alert was in BreakingTicker: removed and replaced with retraction notice

### Very Old Alert (>7 Days)

**Trigger:** User views historical alert

- Subtle "ARCHIVED" badge
- Confidence badge shows "(historical)" note
- CasualtyCounter shows note: "Figures as of [date]"

### Too Many Alerts (Feed Overflow)

**Trigger:** Active conflict generates >100 new alerts per hour

- Feed auto-groups by region: "15 alerts from Beirut"
- Cluster card expands to show individual alerts
- Option to "batch view" vs "individual view"
- Anti-seizure: new alerts batch-loaded every 5s, not real-time per item

---

## Empty State Copy Guidelines

| Situation | Heading | Subtext | CTA |
|-----------|---------|---------|-----|
| No feed alerts | "No alerts for your feed yet" | "Monitoring your regions and topics" | Adjust Filters |
| Filtered to 0 | "No alerts match your filters" | "Try removing some filters" | Clear Filters |
| 0% confidence hidden | "1 unverified report hidden" | "Below your confidence threshold" | Show anyway |
| No pins | "Add a location to monitor" | "Pin places you care about" | Add Pin |
| No breaking news | "No breaking alerts right now" | "All sources active, monitoring continues" | — |
| Sources down | "Feed temporarily unavailable" | "Showing cached alerts" | Status Page |
| Map empty | "No events in this region" | "Monitoring continues" | Zoom out |

**Tone guidelines for empty states:**
- Calm and factual, not alarming
- Active ("monitoring continues") not passive ("nothing found")
- Never apologetic ("sorry, no results")
- Always show what the system IS doing, not just what it isn't
- Provide a next action when possible
