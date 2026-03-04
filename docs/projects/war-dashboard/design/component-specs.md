# Component Specifications — War News Intelligence Dashboard

> **Authoritative reference** for all UI components. Maintained by Vibe Unit UX Team.
> Design tokens live in `frontend/tailwind.config.ts`.

---

## Table of Contents

1. [AlertCard](#1-alertcard)
2. [ConfidenceBadge](#2-confidencebadge)
3. [SourceIcon](#3-sourceicon)
4. [MapPopup](#4-mappopup)
5. [BreakingTicker](#5-breakingticker)
6. [PinMarker](#6-pinmarker)
7. [StrikeMarker](#7-strikemarker)
8. [BroadcastHeader](#8-broadcastheader)
9. [CasualtyCounter](#9-casualtycounter)
10. [TopicFeed](#10-topicfeed)

---

## 1. AlertCard

### Purpose
The primary unit of information in the feed. Displays a single conflict alert with headline, location, confidence level, timestamp, and source attribution.

### States

| State    | Visual Description |
|----------|--------------------|
| default  | Dark card on surface-card bg, border surface-border |
| hover    | Border color shifts to confidence tier color; shadow-card-hover; cursor pointer |
| loading  | Skeleton shimmer on all text fields; `animate-shimmer` |
| empty    | Not rendered — feed shows EmptyFeed component |
| error    | Red border (war-red), error icon, "Failed to load" text |
| breaking | Animated red glow border `shadow-breaking`, "BREAKING" badge visible |
| pinned   | Blue left border accent `border-l-4 border-map-pin` |
| read     | Reduced opacity `opacity-60` on title |

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | ✅ | Unique alert identifier |
| `headline` | `string` | ✅ | Alert headline text (max recommended: 120 chars) |
| `location` | `string \| null` | ✅ | Human-readable location string, null if ungeocoded |
| `coordinates` | `[number, number] \| null` | — | [lat, lng] for map pin; null if unlocated |
| `confidence` | `'verified' \| 'likely' \| 'unverified' \| 'rumor'` | ✅ | Confidence tier |
| `confidenceScore` | `number` | ✅ | 0–100 numeric confidence percentage |
| `sources` | `Source[]` | ✅ | Array of source objects (may be empty) |
| `publishedAt` | `Date \| string` | ✅ | Publication timestamp |
| `severity` | `'critical' \| 'high' \| 'medium' \| 'low'` | ✅ | Alert severity level |
| `isBreaking` | `boolean` | — | Show "BREAKING" label and glow effect |
| `isPinned` | `boolean` | — | User has pinned this alert |
| `topicTags` | `string[]` | — | Topic categories (e.g. ['airstrike', 'civilian']) |
| `onClick` | `() => void` | — | Card click handler |
| `onPin` | `(id: string) => void` | — | Pin/unpin action |

### Visual Spec

```
┌─────────────────────────────────────────────────────┐  ← rounded-card border border-surface-border
│  [BREAKING] [⚡ CRITICAL]              12 min ago   │  ← h-6 flex items-center justify-between
│                                                     │  ← px-card-x pt-card-y
│  Missile strike reported near Beirut airport        │  ← text-alert-title text-text-primary
│  runway — air traffic suspended                     │     line-clamp-2
│                                                     │
│  📍 Beirut, Lebanon                                 │  ← text-alert-meta text-text-muted mt-1
│                                                     │
│  ────────────────────────────────────────────────   │  ← border-t border-surface-border mt-2
│  [✓ VERIFIED 94%]  [AL Jazeera] [Reuters] +2       │  ← flex items-center gap-2 py-2 px-card-x
└─────────────────────────────────────────────────────┘
```

**Dimensions:**
- Min height: `h-auto` (min ~80px)
- Width: full width of parent container
- Padding: `px-4 py-3` (16px / 12px)
- Border radius: `rounded-card` (8px)
- Border: `border border-surface-border`

**Background:** `bg-surface-card` (`#1e293b`)

**Headline typography:**
- Class: `text-alert-title font-semibold text-text-primary`
- Max lines: 2 with `line-clamp-2`
- Overflow: ellipsis

**BREAKING badge:**
- Classes: `text-badge-xs font-bold tracking-badge uppercase px-1.5 py-0.5 rounded bg-war-red text-white animate-breaking`

**Severity pill:**
- Critical: `bg-war-red/20 text-war-red border border-war-red/40`
- High: `bg-war-orange/20 text-war-orange border border-war-orange/40`
- Medium: `bg-war-yellow/20 text-war-yellow border border-war-yellow/40`
- Low: `bg-war-green/20 text-war-green border border-war-green/40`

**Timestamp:** `text-alert-meta font-mono text-text-muted`

**Location line:** `text-alert-meta text-text-muted flex items-center gap-1`

**Hover state:** `hover:border-[confidence-tier-border-color] hover:shadow-card-hover transition-all duration-normal`

### Accessibility
- Wrapper: `<article role="article" aria-label="Alert: {headline}">`
- BREAKING alerts: `aria-live="polite"` on feed container
- Keyboard: focusable with `tabIndex={0}`, Enter/Space triggers onClick
- Color contrast: All text on card backgrounds ≥ 4.5:1 ratio
- Location icon: `aria-hidden="true"` on decorative icons
- Pin button: `aria-label="Pin alert"` / `aria-pressed={isPinned}`

### Edge Cases
- **Very long headline (>200 chars):** `line-clamp-2` truncates with ellipsis; full text in `title` attribute and detail panel
- **No sources:** Show "No sources attributed" in muted text; ConfidenceBadge still shows but adds warning icon
- **Unlocated alert (coordinates: null):** Hide map pin icon; show "Location unspecified" in muted italic
- **0% confidence:** Show `confidence="rumor"` tier with score; add tooltip "Unverified social media report"
- **Very long location string:** `truncate` class with max-w constraint

---

## 2. ConfidenceBadge

### Purpose
Compact visual indicator of an alert's verification confidence tier and numeric score. Used inline in AlertCard, MapPopup, and detail panels.

### States

| State   | Visual |
|---------|--------|
| default | Colored pill with tier label and percentage |
| loading | Skeleton shimmer pill, fixed width |
| zero    | Rumor styling with "?" instead of "0%" |
| compact | Icon-only (no text label) for space-constrained contexts |

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `tier` | `'verified' \| 'likely' \| 'unverified' \| 'rumor'` | ✅ | Confidence classification |
| `score` | `number` | ✅ | 0–100 numeric percentage |
| `size` | `'xs' \| 'sm' \| 'md'` | — | Badge size variant (default: `sm`) |
| `showScore` | `boolean` | — | Show numeric percentage (default: true) |
| `showIcon` | `boolean` | — | Show tier icon (default: true) |
| `compact` | `boolean` | — | Icon-only mode |
| `tooltip` | `boolean` | — | Show hover tooltip with explanation |

### Visual Spec

```
[ ✓ VERIFIED  94% ]   ← verified tier
[ ~ LIKELY    72% ]   ← likely tier
[ ! UNVERIFIED 41% ]  ← unverified tier
[ ✗ RUMOR      8% ]  ← rumor tier
```

**Base classes:** `inline-flex items-center gap-1.5 px-badge-x py-badge-y rounded-badge border text-badge-sm font-mono`

**Tier-specific classes:**
- Verified: `confidence-verified` → bg `#052e16`, text `#22c55e`, border `#166534`
- Likely: `confidence-likely` → bg `#1a1200`, text `#eab308`, border `#713f12`
- Unverified: `confidence-unverified` → bg `#1c0a00`, text `#f97316`, border `#7c2d12`
- Rumor: `confidence-rumor` → bg `#1c0000`, text `#ef4444`, border `#7f1d1d`

**Icon mapping:**
- verified: `✓` (checkmark)
- likely: `~` (tilde)
- unverified: `!` (exclamation)
- rumor: `✗` (cross)

**Size variants:**
- `xs`: `text-badge-xs px-1 py-0.5`
- `sm`: `text-badge-sm px-2 py-0.5` (default)
- `md`: `text-sm px-2.5 py-1`

### Accessibility
- `role="status"` on badge wrapper
- `aria-label="Confidence: {tier}, {score}%"`
- Tooltip (if enabled): `role="tooltip"` with tier explanation text
- Never convey confidence solely by color — always include text/icon

### Edge Cases
- **0% score:** Display as "?" not "0%"; tier forced to rumor; tooltip explains unscored
- **Score > 100:** Cap display at 100%, log warning
- **Loading state:** Fixed-width skeleton `w-24 h-5 skeleton`
- **Compact in tight space:** Show icon + score only, no tier label

---

## 3. SourceIcon

### Purpose
Compact icon + name badge identifying a news source. Used in AlertCard footer, MapPopup, and detail panels. Clicking navigates to the original article.

### States

| State    | Visual |
|----------|--------|
| default  | Small favicon + source name, muted styling |
| hover    | Underline on source name, slight brightness increase |
| loading  | Square skeleton |
| error    | Generic "?" icon when favicon fails |
| overflow | "+N more" chip when >3 sources |

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | ✅ | Source display name |
| `url` | `string` | ✅ | Article URL |
| `faviconUrl` | `string \| null` | — | Favicon URL; fallback to initials |
| `type` | `'official' \| 'media' \| 'social' \| 'wire'` | — | Source type classification |
| `size` | `'sm' \| 'md'` | — | Display size (default: sm) |

### Visual Spec

```
[Ⓐ] Al Jazeera    ← favicon (16×16) + source name
[R]  Reuters
[T]  Twitter/X     ← social type gets different styling
```

**Classes:** `inline-flex items-center gap-1 text-alert-meta text-text-muted hover:text-text-secondary transition-colors`

**Favicon:** `w-4 h-4 rounded-sm object-contain` — fallback to 2-letter initials in `bg-surface-border rounded-sm text-[10px]`

**Overflow chip:** `text-badge-xs text-text-muted bg-surface-border px-1.5 py-0.5 rounded-pill`

### Accessibility
- Wrapper: `<a href={url} target="_blank" rel="noopener noreferrer">`
- `aria-label="{name} — opens original article in new tab"`
- Favicon img: `alt=""` (decorative; name provides context)

### Edge Cases
- **Favicon 404:** Replace with 2-letter initials div
- **Very long source name (>25 chars):** `truncate max-w-[120px]`
- **Social media source:** Add platform icon (X, Telegram, etc.); extra warning tooltip
- **No sources array:** AlertCard shows "No sources" fallback text

---

## 4. MapPopup

### Purpose
Floating popup card anchored to a map marker. Displays alert summary, confidence badge, and action links when a marker is clicked or hovered.

### States

| State   | Visual |
|---------|--------|
| default | Card with arrow pointer, floating above marker |
| loading | Skeleton content while alert data fetches |
| error   | "Could not load alert details" with retry |
| pinned  | Blue accent color on header |

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `alertId` | `string` | ✅ | Alert ID to display |
| `headline` | `string` | ✅ | Short headline |
| `confidence` | confidence type | ✅ | Tier + score |
| `location` | `string` | ✅ | Location string |
| `publishedAt` | `Date` | ✅ | Timestamp |
| `sources` | `Source[]` | — | Source list |
| `onViewDetail` | `() => void` | — | Open detail panel |
| `onClose` | `() => void` | ✅ | Close popup |
| `onPin` | `() => void` | — | Pin the alert |

### Visual Spec

```
┌──────────────────────────────────┐
│ [✓ VERIFIED 94%]          [×]   │  ← h-8 flex justify-between px-3 pt-3
│                                  │
│ Missile strike near Beirut       │  ← text-sm font-semibold text-text-primary
│ airport runway                   │     px-3 line-clamp-3
│                                  │
│ 📍 Beirut, Lebanon  •  12m ago   │  ← text-xs text-text-muted px-3 mt-1
│ [AJ] [R]                         │  ← source icons
│                                  │
│ [View Full Alert →]              │  ← text-xs text-war-blue underline px-3 pb-3
└──────────────────────────────────┘
         ▼  ← arrow pointer
```

**Dimensions:** `w-64` (256px), `max-h-48`, `rounded-map-popup`
**Background:** `bg-surface-elevated border border-surface-border shadow-map-popup`
**Z-index:** `z-map-popup`
**Arrow:** CSS pseudo-element, 8px triangle pointing down to marker

### Accessibility
- `role="dialog" aria-modal="false" aria-label="Alert details: {headline}"`
- Close button: `aria-label="Close popup"`
- Trap focus within popup when open
- Escape key closes popup
- Return focus to trigger marker on close

### Edge Cases
- **Long headline:** `line-clamp-3`; max 3 lines before truncation
- **No location (ungeocoded):** Popup still shows but location line reads "Location unspecified"
- **Many sources (>4):** Show first 3 + "+N more"
- **Off-screen popup:** Map library should auto-flip (above/below/left/right)

---

## 5. BreakingTicker

### Purpose
Horizontally scrolling news ticker bar at the top/bottom of the viewport. Shows breaking alert headlines in real-time. Pauses on hover.

### States

| State   | Visual |
|---------|--------|
| default | Auto-scrolling from right to left, continuous loop |
| paused  | Scroll paused on hover; cursor shows context |
| loading | Static "LOADING ALERTS..." placeholder text |
| empty   | Hidden / collapsed (no breaking news) |
| live    | "● LIVE" indicator pulsing red |

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `alerts` | `BreakingAlert[]` | ✅ | Array of breaking alert objects |
| `speed` | `'normal' \| 'fast' \| 'slow'` | — | Scroll speed (default: normal) |
| `pauseOnHover` | `boolean` | — | Pause animation on hover (default: true) |
| `onAlertClick` | `(id: string) => void` | — | Click handler for individual alerts |
| `className` | `string` | — | Additional classes |

### Visual Spec

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ● LIVE │ BREAKING: Missile strike near Beirut airport · DEVELOPING: UN...  │
└────────────────────────────────────────────────────────────────────────────┘
```

**Container:**
- Height: `h-ticker-h` (40px)
- Background: `bg-surface-elevated border-b border-surface-border`
- Z-index: `z-ticker`
- Shadow: `shadow-ticker`

**LIVE indicator:**
- `flex-shrink-0 flex items-center gap-1.5 px-4 bg-war-red text-white text-ticker-sm tracking-ticker`
- Dot: `w-2 h-2 rounded-full bg-white animate-breaking`

**Ticker track:**
- `flex items-center gap-8 animate-ticker hover:ticker-pause`
- On hover: `animation-play-state: paused`

**Alert item:**
- `text-ticker-md text-text-secondary tracking-ticker whitespace-nowrap cursor-pointer hover:text-text-primary`
- Severity dot before text: color-coded `w-1.5 h-1.5 rounded-full`
- Separator between items: `text-text-muted mx-2`

**Typography:** `font-ticker font-bold tracking-ticker uppercase`

### Accessibility
- `role="marquee" aria-label="Breaking news ticker"`
- `aria-live="polite"` — new alerts announced to screen readers
- Pause control: visible button `aria-label="Pause ticker"` for users who need it
- Respects `prefers-reduced-motion`: switches to static list if motion reduced
- Keyboard: individual alerts are focusable links within the ticker

### Edge Cases
- **Empty alerts array:** Component renders `null` (collapses from layout)
- **Single alert:** No separator needed; still loops
- **Very long headline (>150 chars):** No wrapping, scrolls fully regardless of length
- **Rapid updates:** Smoothly insert new items without interrupting scroll position

---

## 6. PinMarker

### Purpose
Interactive map marker representing a user-saved location pin. Used to show areas the user is tracking. Different from StrikeMarker — this is user-generated, not event-generated.

### States

| State    | Visual |
|----------|--------|
| default  | Blue teardrop pin icon |
| hover    | Scale up 1.2×, show location label |
| selected | Larger with glow, shows count of nearby alerts |
| dragging | Semi-transparent, cursor grabbing |
| loading  | Pulsing circle placeholder |

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | ✅ | Pin identifier |
| `label` | `string` | ✅ | Location name |
| `coordinates` | `[number, number]` | ✅ | [lat, lng] |
| `alertCount` | `number` | — | Nearby alerts count badge |
| `isSelected` | `boolean` | — | Currently selected/active pin |
| `isDraggable` | `boolean` | — | Enable drag to reposition |
| `onSelect` | `(id: string) => void` | — | Click handler |
| `onRemove` | `(id: string) => void` | — | Remove pin action |

### Visual Spec

**Default pin:**
- SVG teardrop shape, `w-8 h-8` (32×32px)
- Fill: `#3b82f6` (map-pin color)
- Stroke: `white` 1.5px
- Drop shadow: `shadow-marker`
- Center dot: white `w-2 h-2 rounded-full`
- Drops in with `animate-marker-drop`

**Alert count badge:**
- Positioned top-right of pin: `-top-2 -right-2`
- `w-5 h-5 rounded-full bg-war-red text-white text-[10px] font-bold flex items-center justify-center`
- Max display: 99+

**Selected state:**
- Scale: `scale-125 transition-transform`
- Glow: `shadow-glow-blue`
- Label shown: `bg-surface-elevated text-text-primary text-xs px-2 py-1 rounded-badge shadow-card -translate-x-1/2 -top-8`

**Z-index:** `z-map-marker`

### Accessibility
- SVG: `role="img" aria-label="{label} pin — {alertCount} alerts nearby"`
- Keyboard: focusable, Enter opens MapPopup, Delete removes pin (with confirm)
- Draggable: announces new position via `aria-live` on drag end

### Edge Cases
- **0 nearby alerts:** No count badge shown
- **99+ alerts:** Badge shows "99+"
- **Very long label:** Truncate at 20 chars in label tooltip
- **Overlapping pins:** Clustering kicks in (managed by map library)

---

## 7. StrikeMarker

### Purpose
Map marker for a reported military event (airstrike, explosion, ground movement, etc.). Event-generated, not user-generated. Severity-coded by color.

### States

| State     | Visual |
|-----------|--------|
| default   | Colored X/explosion icon on map |
| new       | Pulsing ring animation for ~10 seconds after creation |
| hover     | Larger + tooltip preview |
| selected  | Opens MapPopup |
| clustered | Merged into cluster count bubble |

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | ✅ | Alert/event identifier |
| `type` | `'airstrike' \| 'explosion' \| 'ground' \| 'naval' \| 'missile'` | ✅ | Event type |
| `severity` | `'critical' \| 'high' \| 'medium' \| 'low'` | ✅ | Severity for color |
| `coordinates` | `[number, number]` | ✅ | [lat, lng] |
| `isNew` | `boolean` | — | Trigger entry animation |
| `confidence` | confidence type | — | Badge data for popup |
| `onClick` | `(id: string) => void` | — | Opens popup/panel |

### Visual Spec

**Shape:** Circular marker `w-6 h-6` (24px) with event-type icon inside

**Colors by severity:**
- Critical: `bg-war-red shadow-glow-red`
- High: `bg-war-orange shadow-glow-orange`
- Medium: `bg-war-yellow shadow-glow-yellow`
- Low: `bg-war-green`

**Type icons (SVG, white, 14px):**
- airstrike: ✈ aircraft
- explosion: 💥 burst
- ground: ⚔ crossed swords
- naval: ⚓ anchor
- missile: 🚀 projectile

**New pulse ring:**
```
absolute inset-0 rounded-full opacity-0 animate-ping
```
Ring color matches severity color at 40% opacity

**Z-index:** `z-map-marker`

### Accessibility
- `aria-label="{type} — severity: {severity} — {location} — {timestamp}"`
- Keyboard focusable; Enter opens MapPopup
- Screen reader: announced via `aria-live` feed when new

### Edge Cases
- **Ungeocoded event:** Cannot render on map; appears only in feed, not as marker
- **Multiple events same location:** Cluster marker shows count, color = highest severity
- **Extremely recent event (<1 min):** Extra "JUST NOW" badge in popup
- **Event retracted:** Marker removed; if popup open, shows "This alert was retracted"

---

## 8. BroadcastHeader

### Purpose
Full-width header bar used in "Pro Broadcast" view. Displays the organization's branding, live status, active region, and top-level stats for media/institutional users.

### States

| State   | Visual |
|---------|--------|
| default | Dark header with org logo, region, live status |
| live    | "● LIVE" indicator pulsing; timestamp counting up |
| offline | "OFFLINE" badge; muted styling |
| loading | Skeleton for logo and text areas |

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `orgName` | `string` | ✅ | Organization/broadcaster name |
| `logoUrl` | `string \| null` | — | Organization logo |
| `region` | `string` | ✅ | Active monitoring region (e.g., "Middle East") |
| `isLive` | `boolean` | ✅ | Live broadcast status |
| `alertCount` | `number` | — | Total active alerts |
| `lastUpdated` | `Date` | — | Last data refresh timestamp |
| `topics` | `string[]` | — | Active topic tags |
| `customColor` | `string \| null` | — | Brand accent color (hex) |

### Visual Spec

```
┌────────────────────────────────────────────────────────────────────────────┐
│  [LOGO] ORG NAME          MIDDLE EAST     ● LIVE    24 Alerts   14:23 UTC  │
│  ─────────────────────────────────────────────────────────────────────────  │
│  [airstrike] [civilian] [diplomatic] [missile]       ← topic tags           │
└────────────────────────────────────────────────────────────────────────────┘
```

**Container:** `w-full bg-surface-elevated border-b border-surface-border px-6 py-3`

**Logo:** `h-8 w-auto object-contain`; fallback to org name initials in accent color square

**Org name:** `text-lg font-bold text-text-primary tracking-wide`

**Region:** `text-sm font-mono text-text-secondary uppercase tracking-widest`

**LIVE badge:**
- Live: `bg-war-red text-white px-2 py-0.5 rounded-pill text-xs font-bold animate-breaking`
- Offline: `bg-surface-border text-text-muted px-2 py-0.5 rounded-pill text-xs`

**Alert count:** `font-mono text-war-orange font-bold text-sm`

**Timestamp:** `font-mono text-text-muted text-xs`

**Topic tags:** `flex gap-2 mt-2 flex-wrap` — pills with `bg-surface-card border border-surface-border text-text-secondary text-xs px-2 py-0.5 rounded-pill`

### Accessibility
- `role="banner"` on header element
- Live status: `aria-live="polite"` announces status changes
- Custom accent color: Ensure 4.5:1 contrast against `bg-surface-elevated`

### Edge Cases
- **No logo:** Show initials in a colored square using `customColor` or `war-blue`
- **Very long org name:** Truncate at 30 chars, show full in tooltip
- **0 alerts:** Show "No active alerts" in muted text
- **Custom color fails contrast:** Fall back to `war-blue` default

---

## 9. CasualtyCounter

### Purpose
Animated counter displaying reported casualty or displacement figures. Uses tick-up animation for new data. Marked with confidence level. Sensitive component — includes disclaimer.

### States

| State     | Visual |
|-----------|--------|
| default   | Static number with label |
| updating  | Digit rolls through `animate-counter-tick` |
| loading   | Skeleton |
| unverified| Orange/amber styling with "!" indicator |
| zero      | Shows "—" not "0" (no confirmed reports) |

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `label` | `string` | ✅ | e.g., "Reported Killed", "Displaced" |
| `value` | `number \| null` | ✅ | Numeric count; null = no data |
| `confidence` | confidence type | ✅ | Tier for color coding |
| `source` | `string` | — | Data source name |
| `asOf` | `Date` | — | Last updated timestamp |
| `showDisclaimer` | `boolean` | — | Show "figures unverified" disclaimer |

### Visual Spec

```
┌──────────────────┐
│  REPORTED KILLED │  ← label: text-xs font-mono text-text-muted uppercase tracking-wider
│  12,400+         │  ← value: text-4xl font-bold font-mono text-war-red
│  ! Unverified    │  ← confidence badge
│  via UN OCHA     │  ← source: text-xs text-text-muted
└──────────────────┘
```

**Container:** `bg-surface-card border border-surface-border rounded-card p-4`

**Value typography:** `text-4xl font-mono font-bold` — color inherits from confidence tier text color

**Update animation:** `animate-counter-tick` — old value exits up, new enters from bottom

**Disclaimer:** `text-xs text-text-muted italic mt-2`

### Accessibility
- `aria-live="polite"` — announces value changes
- `aria-label="{label}: {value}, confidence: {tier}"`
- Never use color alone to show urgency — always include text label
- Disclaimer always visible (not hidden behind interactions)

### Edge Cases
- **null value:** Show "—" (em dash), "No confirmed data" in muted text
- **0 value:** Show "0" only if source explicitly reports zero; otherwise "—"
- **Very large number (>1M):** Format as "1.2M" with full number in tooltip
- **Rapidly updating:** Debounce animation — max 1 tick per 500ms

---

## 10. TopicFeed

### Purpose
Filterable, scrollable column of AlertCards grouped or filtered by topic tag. The main content area for the dashboard feed. Supports real-time updates.

### States

| State       | Visual |
|-------------|--------|
| default     | List of AlertCards, newest first |
| loading     | 3–5 skeleton AlertCard placeholders |
| empty       | Empty state illustration + message |
| error       | Error message with retry button |
| filtered    | Active filter pills shown; reduced alert count |
| live        | New alert slides in from top with animation |

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `alerts` | `Alert[]` | ✅ | Array of alert objects |
| `topic` | `string \| null` | — | Active topic filter; null = all |
| `loading` | `boolean` | — | Loading state |
| `error` | `string \| null` | — | Error message |
| `onAlertClick` | `(id: string) => void` | — | Alert selection |
| `onLoadMore` | `() => void` | — | Infinite scroll trigger |
| `hasMore` | `boolean` | — | More results available |
| `liveUpdates` | `boolean` | — | Show live update indicator |
| `filters` | `FilterState` | — | Active confidence/severity filters |

### Visual Spec

```
┌──────────────────────────────────────────┐
│  ALL ALERTS          ● Live  [Filters ▼] │  ← header bar
│  ─────────────────────────────────────── │
│  [× airstrike] [× civilian]              │  ← active filter pills (if any)
│  ─────────────────────────────────────── │
│  [AlertCard - BREAKING]                  │
│  [AlertCard]                             │
│  [AlertCard]                             │
│  [AlertCard]                             │
│  [Load More ↓]                          │  ← or infinite scroll trigger
└──────────────────────────────────────────┘
```

**Container:** `flex flex-col h-full overflow-hidden`

**Header:** `flex items-center justify-between px-4 py-3 border-b border-surface-border bg-surface-elevated`

**Filter pills:** `flex gap-2 flex-wrap px-4 py-2 border-b border-surface-border` — pill: `inline-flex items-center gap-1 text-badge-sm bg-surface-card border border-surface-border rounded-pill px-2 py-0.5`

**Alert list:** `flex-1 overflow-y-auto divide-y divide-surface-border`

**New alert entry animation:** Slide in from top with `transition-all duration-300 ease-out`

**Load more button:** `w-full py-3 text-text-muted text-sm hover:text-text-secondary transition-colors`

**Live indicator dot:** `w-2 h-2 rounded-full bg-war-green animate-breaking`

### Accessibility
- `role="feed" aria-busy={loading} aria-label="Alert feed{topic ? ` — ${topic}` : ''}"` 
- New alerts: `aria-live="polite"` on the feed container
- Each AlertCard: `aria-setsize` and `aria-posinset` for proper feed semantics
- Filter controls: `role="toolbar" aria-label="Feed filters"`
- Empty state: `role="status" aria-live="polite"`
- Keyboard: Tab navigates between cards; Ctrl+F focuses filter search

### Edge Cases
- **0 alerts, no filter:** EmptyFeed component (new user onboarding prompt)
- **0 alerts after filter:** "No alerts match your filters" + clear filters button
- **All alerts loading:** Show 4 skeleton cards, staggered fade-in
- **Network error:** Show error card with last-known update timestamp
- **Feed paused (user scrolled up):** Show "N new alerts — tap to refresh" banner at top
- **Very rapid updates (>10/min):** Batch into groups to avoid animation seizure

---

## Shared Component Patterns

### Loading Skeleton
```
<div className="skeleton rounded-card w-full h-20" />
```
Use `animate-shimmer` with gradient from `surface-card` → `surface-border` → `surface-card`.

### Empty State Structure
```tsx
<div role="status" className="flex flex-col items-center justify-center py-16 text-center">
  <Icon className="w-12 h-12 text-text-muted mb-4" />
  <h3 className="text-text-secondary font-semibold mb-2">No alerts yet</h3>
  <p className="text-text-muted text-sm max-w-xs">...</p>
  <Button variant="secondary" className="mt-4">...</Button>
</div>
```

### Error State Structure
```tsx
<div role="alert" className="flex items-center gap-3 p-4 bg-war-red/10 border border-war-red/30 rounded-card">
  <AlertIcon className="text-war-red flex-shrink-0" />
  <p className="text-text-secondary text-sm">{message}</p>
  <Button size="sm" onClick={retry}>Retry</Button>
</div>
```
