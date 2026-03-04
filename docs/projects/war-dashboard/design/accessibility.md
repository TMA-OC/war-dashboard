# Accessibility Specification — War News Intelligence Dashboard

> WCAG 2.1 Level AA compliance target.
> Maintained by Vibe Unit UX Team.

---

## 1. WCAG 2.1 AA — Product-Wide Requirements

### 1.1 Perceivable

| Criterion | Requirement | Implementation |
|-----------|-------------|----------------|
| 1.1.1 Non-text Content | All images have text alternatives | Favicons: `alt=""` (decorative); map markers: descriptive `aria-label`; logos: alt with org name |
| 1.2.x Audio/Video | Not applicable (no media content) | — |
| 1.3.1 Info & Relationships | Structure conveyed programmatically | Semantic HTML: `<article>`, `<nav>`, `<main>`, `<header>`, `<aside>` |
| 1.3.2 Meaningful Sequence | DOM order matches visual order | Feed is top-to-bottom newest-first in DOM |
| 1.3.3 Sensory Characteristics | No instruction by shape/color alone | "BREAKING" = text + red color; confidence = text label + color |
| 1.4.1 Use of Color | Color not sole means of conveying info | All confidence tiers: icon + label + color |
| 1.4.3 Contrast (Normal Text) | ≥ 4.5:1 ratio | See Section 3 below |
| 1.4.4 Resize Text | Text resizable to 200% without loss | No `px` font sizes in body; use `rem`. Tested at 200% zoom |
| 1.4.5 Images of Text | Avoid text in images | All text is DOM text |
| 1.4.10 Reflow | Content reflows at 320px width | Responsive layout: sidebar collapses, ticker stays visible |
| 1.4.11 Non-text Contrast | UI components ≥ 3:1 against background | Borders, icons, input fields all checked |
| 1.4.12 Text Spacing | No loss of content with spacing changes | Tested with Bookmarklet for text spacing |
| 1.4.13 Content on Hover/Focus | Dismissable, hoverable, persistent | Map popups: not auto-dismissed; closeable by Escape |

### 1.2 Operable

| Criterion | Requirement | Implementation |
|-----------|-------------|----------------|
| 2.1.1 Keyboard | All functionality via keyboard | Tab order, Enter/Space for actions, arrow keys in feeds |
| 2.1.2 No Keyboard Trap | Focus not trapped except modals | Modal dialogs trap focus internally; Escape exits |
| 2.2.2 Pause/Stop/Hide | Ticker can be paused | BreakingTicker: visible pause button + hover pause |
| 2.3.1 Three Flashes | No flashing >3/sec | Animations are smooth transitions; no strobe |
| 2.4.1 Bypass Blocks | Skip navigation link | `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a>` |
| 2.4.2 Page Titled | Descriptive page titles | `<title>War Dashboard — {region} — {alert count} active alerts</title>` |
| 2.4.3 Focus Order | Logical focus sequence | Header → Ticker → Sidebar → Feed → Map |
| 2.4.4 Link Purpose | Link purpose from context | Source links: `aria-label="Read article from {source}"` |
| 2.4.6 Headings/Labels | Descriptive headings | `<h1>` for region; `<h2>` for feed sections |
| 2.4.7 Focus Visible | Visible focus indicator | Custom focus ring: `focus-visible:outline-2 focus-visible:outline-war-blue focus-visible:outline-offset-2` |
| 2.5.3 Label in Name | Visible label matches accessible name | Button text matches `aria-label` |

### 1.3 Understandable

| Criterion | Requirement | Implementation |
|-----------|-------------|----------------|
| 3.1.1 Language of Page | `lang` attribute on `<html>` | `<html lang="en">` (or `lang="ar"` for Arabic) |
| 3.2.1 On Focus | No unexpected context change on focus | Map markers show popup only on click, not focus |
| 3.3.1 Error Identification | Errors described in text | Form validation: `aria-describedby` pointing to error message |
| 3.3.2 Labels or Instructions | Labels for all inputs | All form inputs have visible `<label>` elements |

### 1.4 Robust

| Criterion | Requirement | Implementation |
|-----------|-------------|----------------|
| 4.1.1 Parsing | Valid HTML | ESLint jsx-a11y rules enforced |
| 4.1.2 Name, Role, Value | Custom widgets have ARIA | All custom components: `role`, `aria-*`, state updates |
| 4.1.3 Status Messages | Status announced without focus | `aria-live="polite"` on feed, error regions |

---

## 2. Component-Specific Accessibility Checks

### AlertCard
- [ ] `<article role="article">` wrapper
- [ ] `aria-label="Alert: {headline truncated to 80 chars}"`
- [ ] BREAKING badge: `aria-live="assertive"` on container for new breaking alerts
- [ ] Pin button: `aria-label="Pin this alert" aria-pressed={isPinned}`
- [ ] Timestamp: `<time dateTime={ISO8601}>` element
- [ ] Focus ring visible on card
- [ ] Enter/Space triggers card click
- [ ] Source links: `target="_blank" rel="noopener" aria-label="{source} — opens in new tab"`

### ConfidenceBadge
- [ ] `role="img" aria-label="Confidence: {tier}, {score}%"`
- [ ] Never color-only: always includes tier label text
- [ ] Tooltip (if shown): `role="tooltip"` with `aria-describedby` connection
- [ ] Loading state: `aria-busy="true" aria-label="Loading confidence score"`

### BreakingTicker
- [ ] `role="marquee" aria-label="Breaking news ticker"`
- [ ] Visible pause button: `aria-label="Pause ticker" aria-pressed={paused}`
- [ ] `prefers-reduced-motion`: animation disabled; static list shown instead
- [ ] Individual items: `<a>` elements, keyboard focusable
- [ ] Screen reader: `aria-live="polite"` announces new items (throttled to avoid spam)

### MapPopup
- [ ] `role="dialog" aria-modal="false" aria-labelledby="popup-title-{id}"`
- [ ] Focus moved to popup on open
- [ ] Focus returned to trigger element on close
- [ ] Escape key closes popup
- [ ] Close button: `aria-label="Close alert popup"`
- [ ] All interactive elements keyboard accessible within popup

### PinMarker / StrikeMarker
- [ ] SVG: `role="img" aria-label="{description}"`
- [ ] Keyboard focusable (tabIndex={0})
- [ ] Enter opens popup
- [ ] PinMarker Delete key: triggers remove flow with confirmation
- [ ] New marker announcement: `aria-live="polite"` on map region

### BroadcastHeader
- [ ] `role="banner"` on `<header>`
- [ ] Live status: `aria-live="polite"` for status changes
- [ ] Custom logo: `alt="{orgName} logo"`
- [ ] Alert count: `aria-label="{n} active alerts"`

### CasualtyCounter
- [ ] `aria-live="polite"` — announces value changes
- [ ] `aria-label="{label}: {value}"`
- [ ] Disclaimer always visible in DOM (not hidden)
- [ ] `role="status"` for the counter container

### TopicFeed
- [ ] `role="feed" aria-label="Alert feed"` on list container
- [ ] `aria-busy="true"` during loading
- [ ] Each card: `aria-setsize` and `aria-posinset` (when total known)
- [ ] New alert notification: `aria-live="polite"` banner
- [ ] Filter toolbar: `role="toolbar" aria-label="Alert filters"`
- [ ] Empty state: `role="status"`

---

## 3. Color Contrast Ratios

All ratios calculated against their respective backgrounds. AA minimum = 4.5:1 (normal text), 3:1 (large text / UI components).

### Confidence Badge Colors

| Tier | Text Color | Background | Ratio | AA Pass? |
|------|-----------|------------|-------|----------|
| Verified (text) | `#22c55e` | `#052e16` | **7.8:1** | ✅ AA |
| Likely (text) | `#eab308` | `#1a1200` | **9.2:1** | ✅ AA |
| Unverified (text) | `#f97316` | `#1c0a00` | **7.1:1** | ✅ AA |
| Rumor (text) | `#ef4444` | `#1c0000` | **5.4:1** | ✅ AA |

### Confidence Badge Borders vs Background

| Tier | Border | Background | Ratio | 3:1 Pass? |
|------|--------|------------|-------|-----------|
| Verified border | `#166534` | `#052e16` | **3.1:1** | ✅ AA |
| Likely border | `#713f12` | `#1a1200` | **3.4:1** | ✅ AA |
| Unverified border | `#7c2d12` | `#1c0a00` | **3.2:1** | ✅ AA |
| Rumor border | `#7f1d1d` | `#1c0000` | **3.0:1** | ✅ AA (border) |

### Text on Surface Backgrounds

| Text | Background | Ratio | AA Pass? |
|------|-----------|-------|----------|
| `#ffffff` (primary) | `#1e293b` (card) | **13.7:1** | ✅ AAA |
| `#cbd5e1` (secondary) | `#1e293b` (card) | **9.1:1** | ✅ AAA |
| `#64748b` (muted) | `#1e293b` (card) | **3.3:1** | ⚠️ AA for large text only |
| `#ffffff` (primary) | `#0f172a` (elevated) | **15.7:1** | ✅ AAA |
| `#cbd5e1` (secondary) | `#0f172a` (elevated) | **10.4:1** | ✅ AAA |
| `#64748b` (muted) | `#0f172a` (elevated) | **3.8:1** | ⚠️ Large text only |

> **Note:** Muted text (`#64748b`) does not meet 4.5:1 AA for normal text. Use muted text only for:
> - Non-critical metadata (timestamps, IDs)
> - Placeholder text (≥14px)
> - Decorative elements
> Never use muted text for actionable content or important information.

### War Severity Colors on Surface-card

| Color | Hex | On `#1e293b` | Ratio | Pass? |
|-------|-----|-------------|-------|-------|
| war-red | `#ef4444` | — | **5.1:1** | ✅ AA |
| war-orange | `#f97316` | — | **5.7:1** | ✅ AA |
| war-yellow | `#eab308` | — | **8.4:1** | ✅ AAA |
| war-green | `#22c55e` | — | **6.9:1** | ✅ AA |
| war-blue | `#3b82f6` | — | **4.6:1** | ✅ AA |
| war-purple | `#a855f7` | — | **4.8:1** | ✅ AA |

---

## 4. Keyboard Navigation Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        KEYBOARD NAVIGATION MAP                              │
└─────────────────────────────────────────────────────────────────────────────┘

  PAGE LOAD FOCUS ORDER:
  ┌─────────────────────────────────────────────────────────┐
  │  [Skip to content] ← first focusable, sr-only until     │
  │                       focused                           │
  │  [Header nav items]                                     │
  │  [Ticker pause button]                                  │
  │  [Sidebar: filter controls]                             │
  │  [Alert feed: first AlertCard]                          │
  │  [Map: first marker]                                    │
  └─────────────────────────────────────────────────────────┘

  GLOBAL SHORTCUTS (when no modal open):
  ┌──────────────┬──────────────────────────────────────────┐
  │  Key         │  Action                                  │
  ├──────────────┼──────────────────────────────────────────┤
  │  /           │  Focus search / filter input             │
  │  Escape      │  Close open popup/panel/modal            │
  │  Space       │  Pause/resume ticker (when ticker focused)│
  │  Tab         │  Forward focus navigation                │
  │  Shift+Tab   │  Backward focus navigation               │
  │  ?           │  Open keyboard shortcuts help overlay    │
  └──────────────┴──────────────────────────────────────────┘

  ALERT FEED (TopicFeed focused):
  ┌──────────────┬──────────────────────────────────────────┐
  │  Key         │  Action                                  │
  ├──────────────┼──────────────────────────────────────────┤
  │  ↑ / ↓      │  Navigate between AlertCards             │
  │  Enter       │  Open alert detail panel                 │
  │  P           │  Pin/unpin focused alert                 │
  │  Escape      │  Close detail panel, return to card      │
  └──────────────┴──────────────────────────────────────────┘

  MAP (map region focused):
  ┌──────────────┬──────────────────────────────────────────┐
  │  Key         │  Action                                  │
  ├──────────────┼──────────────────────────────────────────┤
  │  Tab         │  Next marker                             │
  │  Shift+Tab   │  Previous marker                         │
  │  Enter       │  Open MapPopup for focused marker        │
  │  Escape      │  Close MapPopup                          │
  │  Delete      │  Remove PinMarker (after confirm dialog) │
  │  + / -       │  Zoom in/out                             │
  │  Arrow keys  │  Pan map                                 │
  └──────────────┴──────────────────────────────────────────┘

  MODAL DIALOGS:
  ┌──────────────┬──────────────────────────────────────────┐
  │  Key         │  Action                                  │
  ├──────────────┼──────────────────────────────────────────┤
  │  Tab         │  Cycle within modal (trapped)            │
  │  Shift+Tab   │  Reverse cycle within modal              │
  │  Escape      │  Close modal, return focus to trigger    │
  │  Enter       │  Confirm primary action                  │
  └──────────────┴──────────────────────────────────────────┘

  FOCUS RING STYLING:
  outline: 2px solid #3b82f6 (war-blue)
  outline-offset: 2px
  border-radius: matches element (card → rounded-card)
  Classes: focus-visible:outline-2 focus-visible:outline-war-blue focus-visible:outline-offset-2
  Note: Use focus-visible (not focus) to avoid showing ring on mouse click
```

---

## 5. Motion & Animation

- All animations respect `prefers-reduced-motion: reduce`
- Ticker: converts to static scrolling list (CSS `overflow: auto`) when motion reduced
- Map animations: marker drops are instant
- Pulsing effects: disabled
- Counter tick: instant value change
- Implementation:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 6. Testing Checklist

### Automated
- [ ] axe-core in CI (zero violations required)
- [ ] eslint-plugin-jsx-a11y (zero warnings)
- [ ] Lighthouse accessibility score ≥ 95

### Manual
- [ ] Full keyboard navigation (no mouse) for all core flows
- [ ] VoiceOver (macOS/iOS) — feed navigation test
- [ ] NVDA + Chrome (Windows) — alert card announcement test
- [ ] 200% browser zoom — layout integrity test
- [ ] Windows High Contrast mode — all content visible
- [ ] `prefers-reduced-motion` — no animations
- [ ] Color blindness simulation (Deuteranopia) — confidence tiers distinguishable
