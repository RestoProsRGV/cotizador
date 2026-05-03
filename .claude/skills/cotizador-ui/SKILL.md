---
name: cotizador-ui
description: >
  Reference guide for the cotizador UI design system, component patterns,
  routing rules, and layout conventions. Covers RestoPros brand colors,
  mobile bottom nav structure, desktop sidebar layout, AreaDetail tab
  structure, device routing logic, i18n requirements, CalcInput for
  math expressions in quantity fields, and Encircle design language.
  Use when building UI components, adding new screens, routing between
  mobile and desktop, adding text strings, styling a component, or
  wiring quantity inputs in cotizador. Triggers on: "cotizador UI",
  "design system", "RestoPros colors", "mobile nav", "desktop layout",
  "add a screen", "i18n string", "CalcInput", "device routing",
  "AreaDetail tabs", "style a component".
---

# Cotizador — UI Patterns & Design System

Visual rules, layout patterns, and component conventions for cotizador.

## Brand colors

| Token | Value | Use |
|-------|-------|-----|
| RestoPros blue | `#2196F3` | Primary action, active states |
| Sidebar dark | `#1e2535` | Desktop sidebar background |
| Sidebar icon inactive | `#8892a4` | Icon default state |
| Sidebar icon active | `rgba(33,150,243,0.12)` bg + `#2196F3` icon | Active route |

## Layout: Mobile (`/estimates/*`)

Field tool. Five fixed bottom-nav tabs — **no scroll**, no overflow:

| Tab | Route |
|-----|-------|
| Setup | `/estimates/:id/setup` |
| Areas | `/estimates/:id/areas` |
| General | `/estimates/:id/general` |
| Total | `/estimates/:id/total` |
| Present | `/estimates/:id/present` |

Prep, Demo, Cleaning, and Equipment live **inside AreaDetail** as internal tabs — they are NOT in the bottom nav.

AreaDetail internal tabs (4):
1. Prep Work
2. Demo
3. Cleaning
4. Equipment

## Layout: Desktop (`/desktop/*`)

Admin and review tool.

- Sidebar: `64px` wide, dark (`#1e2535`), icon-only, 44px touch targets
- RP logo at top, user avatar at bottom
- Full-width content area to the right
- Routes: `/desktop/estimates`, `/desktop/estimates/:id`, `/desktop/admin/*`

## Device routing

```
PWA (standalone display mode) → always /estimates/* (mobile)
Browser ≥ 1024px → /desktop/* (desktop)
Browser < 1024px → /estimates/* (mobile)
Deep links → load directly, no redirect
```

Implemented in `useDeviceRedirect` hook. `standalone` check via `window.matchMedia('(display-mode: standalone)')`.

## i18n — zero hardcoded strings

Every visible string must use `t()` from `react-i18next`. No hardcoded English text in JSX.

```tsx
// CORRECT
const { t } = useTranslation()
<h1>{t("setup.title")}</h1>

// WRONG
<h1>Job Setup</h1>
```

Add new keys to `src/locales/en.json`. All module and UI names are i18n keys so they can change for market launch without code edits.

## CalcInput — quantity fields

All quantity inputs accept arithmetic expressions (`3*12`, `2+8`, `(4+2)*16`).

```tsx
import CalcInput from "@/components/ui/CalcInput"

// CORRECT — supports math expressions
<CalcInput value={qty} onChange={setQty} />

// WRONG — blocks expression input
<input type="number" value={qty} onChange={...} />
```

`CalcInput` wraps `useCalcInput` hook. Use `CalcInput` component (not the hook directly) inside `.map()` lists — hooks can't be called conditionally.

On blur: expression is evaluated via `mathjs`. Invalid expression flashes red border for 1.5s and reverts. Supabase always receives the evaluated number.

## AppHeader statusBadge

When `statusBadge` prop is present, AppHeader height increases from `56px` to `64px` to accommodate the dot + label row. Only shown on Total screen to avoid fetching estimate status on every tab.

## Design reference: Encircle

Cotizador replicates Encircle's visual patterns. RestoPros blue (`#2196F3`) replaces Encircle orange. This reduces training time because the RestoPros team already uses Encircle daily.

Follow Encircle layout decisions: dark sidebar, white content area, card-based lists, bottom sheet for modals.

## Examples

### Example 1: Adding a new mobile screen
User says: "Add a Photos screen to the estimate flow"

Actions:
1. Create route `/estimates/:id/photos` in `src/App.tsx`
2. Add tab to `EstimateNav.tsx` (only if it belongs in bottom nav; otherwise access via AreaDetail)
3. Add all strings to `src/locales/en.json` under `photos.*`
4. Use `navigate("/estimates/:id/photos")` for programmatic navigation — not `navigate(-1)`

### Example 2: Adding a quantity field to a new module
User says: "Add a square footage input to the new Flooring tab"

Actions:
1. Import `CalcInput` from `@/components/ui/CalcInput`
2. Wire: `<CalcInput value={sqft} onChange={setSqft} />`
3. Store evaluated result to Supabase (never the raw expression string)
4. Add label string to `en.json`

### Example 3: Styling an active sidebar icon (desktop)
```tsx
const isActive = location.pathname.startsWith("/desktop/estimates")

<div style={{
  background: isActive ? "rgba(33,150,243,0.12)" : "transparent",
  borderRadius: 8,
}}>
  <Icon color={isActive ? "#2196F3" : "#8892a4"} />
</div>
```

## Troubleshooting

### Error: Text shows raw translation key instead of string
**Cause:** Key missing from `src/locales/en.json`.
**Solution:** Add the key. Pattern: `"section.subsection.label": "English text"`.

### Error: Device redirect loops between mobile and desktop
**Cause:** `EstimatesEntryPoint` not wrapping the `/estimates` route.
**Solution:** Check `src/App.tsx` — `/estimates` must use `EstimatesEntryPoint` which breaks the redirect loop.

### Error: Math expression in CalcInput not evaluating
**Cause:** Using `<input type="number">` instead of `CalcInput`.
**Solution:** Replace with `<CalcInput>` — `type="number"` blocks non-numeric characters before the hook sees them.
