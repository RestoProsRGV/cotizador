# Architecture

## Mobile vs Desktop Split

**Mobile** (`/estimates/*`, `/login`): Field estimation tool — fast, minimal, touch-optimized. Used on-site by technicians. Minimal UI, large tap targets, offline-tolerant.

**Admin** (`/admin/*`): Configuration screens that work on desktop too. Currently: Price Management + Materials. Future: Suggestion Rules editor, reporting.

**Desktop** (`/desktop/*`): Reserved for future desktop-only views. Will provide a wider-canvas UI for:
- Reporting and multi-estimate review
- Suggestion rule editing (currently hardcoded in `demoItems.ts`)
- Material management (currently in `/admin/prices` → Materials tab)
- Team management, invoice generation

**Architecture principles:**
- Same Supabase backend and auth for all route prefixes
- Same `RequireAuth` + `requireOwner` protection
- Mobile shows only what a tech needs on-site — no configuration clutter
- Configuration screens will eventually migrate from `/admin/*` to `/desktop/*`
- Route comment in `App.tsx` documents this intent for future sessions

## Device Routing

Root URL (`/`) and `/estimates` auto-detect context:
- PWA (standalone display mode) → always routes to mobile (`/estimates/*`)
- Browser width ≥ 1024px → routes to desktop (`/desktop/*`)
- Browser width < 1024px → routes to mobile
- Deep links bypass detection and load directly

`useDeviceRedirect` hook in `src/hooks/useDeviceRedirect.ts` handles this logic.
`EstimatesEntryPoint` component at `/estimates` prevents infinite redirect for mobile.

## Route Structure

```
/                          → RootRedirect (device-aware)
/login                     → public login screen
/estimates                 → EstimatesEntryPoint (mobile/PWA only)
/estimates/new             → NewEstimate
/estimates/:id/setup       → Setup (edit estimate in place, auto-save)
/estimates/:id/areas       → Areas
/estimates/:id/areas/:areaId → AreaDetail (4 per-area tabs: Prep/Demo/Cleaning/Equipment)
/estimates/:id/general     → General
/estimates/:id/total       → Total
/estimates/:id/present     → Present (public, no auth)
/admin/prices              → AdminPrices (requireOwner)
/desktop/estimates         → DesktopEstimatesList
/desktop/estimates/:id     → DesktopEstimateDetail
/desktop/admin/prices      → DesktopAdminPrices (requireOwner)
/desktop/admin/suggestion-rules → DesktopSuggestionRules (requireOwner)
```

## Navigation Paths

**Mobile bottom nav** (5 fixed tabs, always visible):
Setup · Areas · General · Total · Present

**AreaDetail tabs** (4 per-area tabs):
Prep · Demo · Cleaning · Equipment

**Desktop sidebar** (icon-only, 64px, `#1e2535`):
Estimates (LayoutList) · Admin Prices (Settings) · Suggestion Rules (Zap)
