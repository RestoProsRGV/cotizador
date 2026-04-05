# Changelog — Cotizador RestoPros

## How to use
Every development session adds an entry. Format:
- Date
- Decisions made
- Commits pushed
- Open items

---

## Session: April 3, 2026 — PWA Manifest

### Decisions made
- Minimal service worker (pass-through, no caching) — sufficient for browser installability criteria
- Icons generated programmatically via `scripts/generate-icons.cjs` (canvas npm package), committed as PNGs
- Vite PWA plugin skipped — plain manifest.json + sw.js is enough for now

### Files created/modified
- `public/manifest.json` — PWA manifest (name, icons, start_url, display: standalone)
- `public/sw.js` — minimal pass-through service worker
- `public/icons/icon-192.png` — generated blue circle + RP, 192×192px
- `public/icons/icon-512.png` — generated blue circle + RP, 512×512px
- `scripts/generate-icons.cjs` — icon generation script (canvas)
- `src/registerSW.ts` — SW registration helper
- `src/main.tsx` — calls registerSW() on startup
- `index.html` — manifest link, theme-color, apple-mobile-web-app-* meta tags

### Commits pushed
- `0843fae` feat: PWA manifest — installable on iPhone home screen

### Open items
- Suggestion Rules Manager — Admin desktop UI
- PWA offline caching — service worker currently pass-through only
- Sentry — error monitoring for PROD
- PDF output — not yet tested on a real estimate

---

## Session: April 3, 2026 — Smart Device Redirect

### Decisions made
- Root URL (`/`) and `/estimates` auto-detect device context: standalone/PWA → mobile, wide browser (≥1024px) → desktop
- `EstimatesEntryPoint` wraps `/estimates` route — desktop browser redirects onward, mobile renders `EstimatesList` (no infinite loop)
- Test default: jsdom `window.innerWidth` overridden to 0 in setup.ts so tests use mobile path by default

### Files changed
- `src/hooks/useDeviceRedirect.ts` — new hook
- `src/App.tsx` — `RootRedirect` + `EstimatesEntryPoint` components replace static redirect
- `src/test/setup.ts` — added `matchMedia` stub + `innerWidth = 0` default
- `src/hooks/useDeviceRedirect.test.ts` — 6 tests (standalone, wide, narrow, iPad combos)

### Commits pushed
- `3e3928f` feat: smart device redirect — auto-route desktop vs mobile on entry

### Open items
- Suggestion Rules Manager — Admin desktop UI
- PWA manifest — installable on phone home screen (hook is ready, waiting on manifest)
- Sentry — error monitoring for PROD
- PDF output — not yet tested on a real estimate

---

## Session: April 3, 2026 — Desktop UI

### Decisions made
- Desktop UI uses Encircle layout pattern: 64px dark sidebar (`#1e2535`) + full-width content area
- Sidebar is icon-only (no labels) with 44px touch targets — RP logo mark at top, user avatar at bottom
- Desktop routes live at `/desktop/*` — same auth, same Supabase backend, read-only views
- `DesktopAdminPrices` wraps existing `AdminPrices` with sidebar only (no second header) — no rebuild needed
- Active sidebar item: blue background `rgba(33,150,243,0.12)` + blue icon; inactive: `#8892a4`

### Pages built
- **`/desktop/estimates`** — `DesktopEstimatesList`: full-width data table with search + status filter, totals aggregated from `line_items`, EMRG badge, row-click navigation
- **`/desktop/estimates/:id`** — `DesktopEstimateDetail`: 4-tab view (Overview, Areas, General, Total) with `AreaSlideOver` panel for per-area line items
- **`/desktop/admin/prices`** — `DesktopAdminPrices`: sidebar + existing AdminPrices (owner-only)

### Files created
- `src/layouts/DesktopShell.tsx`
- `src/components/desktop/DesktopSidebar.tsx`
- `src/components/desktop/DesktopHeader.tsx`
- `src/components/desktop/EstimatesTable.tsx`
- `src/components/desktop/AreaSlideOver.tsx`
- `src/pages/desktop/DesktopEstimatesList.tsx`
- `src/pages/desktop/DesktopEstimateDetail.tsx`
- `src/pages/desktop/DesktopAdminPrices.tsx`
- `src/pages/desktop/__tests__/DesktopEstimatesList.test.tsx`
- `src/pages/desktop/__tests__/DesktopEstimateDetail.test.tsx`

### Commits pushed
- `b5fbd1f` feat: desktop UI — /desktop/* routes with Encircle-inspired layout

### Open items
- Suggestion Rules Manager — Admin desktop UI
- Desktop UI routes (/desktop/*) ✅ done
- PWA manifest — installable on phone home screen
- Sentry — error monitoring for PROD
- PDF output — not yet tested on a real estimate

---

## Session: April 3, 2026 — QA Review #1

### Decisions made
- Bottom nav simplified to 5 fixed tabs (no scroll): Setup · Areas · General · Total · Present
- Prep, Demo, Cleaning, Equipment removed from bottom nav — live exclusively inside AreaDetail
- Area cards show only name + SF — removed material count badge and colored dots
- SPA routing fix required: vercel.json rewrite rule added
- Present to Client is a full-page scroll view, not a modal overlay

### Bugs fixed
- 🔴 SPA routing: direct URL navigation returned 404 — fixed with vercel.json
- 🔴 Present to Client scroll: content disappeared on scroll — fixed overflow/height
- 🟡 General tab: Haul Debris and Disposal not auto-generating — investigated and fixed
- 🟡 Total screen: "Water" category label incorrect — fixed to correct module label
- 🟡 Total screen: Prep Work missing from breakdown — fixed aggregation query

### Commits pushed
- `6bee6c9` vercel.json — SPA rewrite rule, fix 404 on direct URL navigation
- `f9669d6` fix: nav simplification, scroll bug, general items, total display

### Open items
- Suggestion Rules Manager — Admin desktop UI
- Desktop UI routes (/desktop/*)
- PWA manifest — installable on phone home screen
- Sentry — error monitoring for PROD
- PDF output — not yet tested on a real estimate

---

## Session: April 3, 2026

### Decisions made
- Per-area architecture: Prep, Demo, Cleaning, Equipment scoped per area. General is project-level.
- Mobile vs Desktop split: Mobile = field tool. Desktop = admin and config (planned).
- Flood Cut 2ft and 4ft are separate items with different insulation formulas.
- Containment always auto-includes Peel & Seal Zipper (92% co-occurrence in 62 real estimates).
- Disinfectant only for Cat 2/Cat 3 — validated against 62 real estimates.
- Material selection: pick closest from catalog + add note if not exact match.
- Emergency Fee: $250 flat, outside M-F 8am-5pm.
- Equipment default: 3 days for all equipment.
- i18n from day one — all UI strings use translation keys, names may change for market launch.
- Xactimate price sync via Excel export (ESX files are encrypted).
- Excel price code = Cat + '/' + Sel columns (e.g., WTR/DRY).
- Encircle visual language adopted — RestoPros blue replaces Encircle orange.
- Prep Work is per-area. General is project-level.
- Area-type pre-loading: Bathroom pre-suggests vanity/sink/faucet, Kitchen pre-suggests cabinets, etc.

### Commits pushed
- `029ba54` Auth — Supabase Auth, protected routes, login screen
- `a828868` Estimates List — search, EMRG badge, FAB
- `2a98299` Admin Prices — Xactimate XLSX parser, owner-only
- `64b86a2` PDF output — EstimatePDF + useEstimatePDF hook
- `6b41cec` Tests — 188 tests across 10 files
- `8d1000f` Areas — room grid, BottomSheet, material chips, Supabase CRUD
- `0b6e16a` Demo — 6 collapsible sections, auto-suggestions, Flood Cut 2ft/4ft
- `735d997` Cleaning — auto-generation, AUTO badges, isManualOverride
- `17fda7e` Equipment — IICRC formulas, formula annotations
- `0337c0f` General — auto-items, supervision RPC, emergency row
- `9132af0` Total + Present-to-client view
- `a4fc2e2` EstimateNav — 7-tab scrollable nav
- `7135154` Flood Cut split + route architecture + CLAUDE.md updates
- `a3db95f` Areas: ft+in dimensions, material chips+More, material note flow, Admin Materials tab
- `63610cb` Per-area restructure — PrepTab, DemoTab, CleaningTab, EquipmentTab, AreaDetail
- `5e2aecc` 4 bug fixes: area selector chips, cleaning groups, equipment formulas, General tab
- `35b7da7` docs: DECISIONS.md — all business logic and architecture decisions
- `36512a1` docs: DECISIONS.md + CHANGELOG.md linked into CLAUDE.md for automatic context loading

### Open items (decided but not yet built)
- Suggestion Rules Manager — Admin desktop UI
- Desktop UI routes (/desktop/*)
- PWA manifest — installable on phone home screen
- Sentry — error monitoring for PROD
- PDF output — not yet tested on a real estimate

---

## Session: April 3, 2026 — Setup Screen + PWA Fixes

### Decisions made
- Setup screen auto-saves to Supabase on blur (text) / onChange (selectors) — no explicit Save button
- Fire added as a 4th job type (water/mold/storm/fire); category = null for fire, same as storm
- datetime-local shows estimate's `created_at`; changing it recalculates and saves the `emergency` boolean
- `isEmergencyCall` mocked in tests to avoid timezone-dependent failures
- `mobile-web-app-capable` meta tag added for Android PWA installability
- manifest.json description updated to "…tool for RestoPros RGV"

### Files created/modified
- `src/screens/Setup.tsx` — new screen: edit estimate in place, auto-save, fire job type, emergency badge
- `src/screens/__tests__/Setup.test.tsx` — 10 unit tests
- `src/App.tsx` — added `/estimates/:id/setup` route + `Setup` import
- `src/components/layout/EstimateNav.tsx` — Setup tab now links to `/setup`; active logic simplified
- `src/locales/en.json` — added `newEstimate.jobTypeFire`
- `index.html` — added `mobile-web-app-capable` meta tag (Android PWA)
- `public/manifest.json` — description updated to include "tool"

### Commits pushed
- `8c89f72` feat: Setup screen — edit estimate in place, auto-save, fire job type + PWA meta fixes

### Open items
- Suggestion Rules Manager — Admin desktop UI
- PWA offline caching — service worker currently pass-through only
- Sentry — error monitoring for PROD
- PDF output — not yet tested on a real estimate

### Deploy verification
- Commit: `0843fae`
- Tests: 219+ passing
- /gstack:review: ✅ (applied retroactively — pre-push rule starts now)
- Vercel: READY ✅

---

## Session: April 5, 2026 — Sentry Error Monitoring

### Decisions made
- Sentry initializes only in PROD (`import.meta.env.PROD`) — no dev/test noise
- tracesSampleRate: 0.2 (20% of transactions)
- Auth errors filtered out in `beforeSend` — expected behavior, not bugs
- One `Sentry.ErrorBoundary` at root — no per-component boundaries
- `.env.example` force-committed (`.env*` glob in `.gitignore` would otherwise exclude it)
- Sentry source maps upload via `sentryVitePlugin` on production builds only

### Commits pushed
- `c938f66` feat: Sentry error monitoring — prod-only, ErrorBoundary at root

### Open items
- Add Vercel environment variables: VITE_SENTRY_DSN, VITE_SENTRY_ORG, VITE_SENTRY_PROJECT, SENTRY_AUTH_TOKEN
- Create Sentry project and copy DSN
- Run a real job estimate end-to-end to validate pricing and formulas
- Setup screen QA (never tested on device)
- Suggestion Rules Manager — Admin desktop UI
- Service worker caching strategy (deferred)

### Deploy verification
- Commit: `c938f66`
- Tests: 256 passing
- /gstack:review: ✅ clean
- Vercel: READY ✅

---

## Session: April 3, 2026 — Workflow Upgrades

### Decisions made
- claude.ai = analysis layer, Claude Code = implementation only (formalized)
- /gstack:review mandatory before every push to main
- Spec docs required before features touching 3+ files
- CLAUDE.md split into domain files when >150 lines
- Supabase MCP available in claude.ai for production data auditing
- Deploy verification added to every CHANGELOG session entry

### Commits pushed
- `2ac7288` docs: workflow upgrades — pre-push checklist, spec docs, deploy verification

### Open items
- Run a real job estimate end-to-end to validate pricing and formulas
- Setup screen QA (never tested)
- Sentry — error monitoring for PROD
- Suggestion Rules Manager — Admin desktop UI
- Service worker caching strategy (deferred)
- Desktop UI QA on real wide screen
- Split CLAUDE.md into domain files (when it hits 150 lines)

### Deploy verification
- Commit: `2ac7288`
- Tests: 256 passing
- /gstack:review: ✅ clean
- Vercel: READY ✅

---

## Template for future sessions

## Session: [DATE] — [Topic]

### Decisions made
-

### Commits pushed
-

### Open items
-

### Deploy verification
- Commit: [hash]
- Tests: [X] passing
- /gstack:review: ✅ clean
- Vercel: READY ✅
