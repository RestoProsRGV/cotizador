# Changelog — Cotizador RestoPros

## How to use
Every development session adds an entry. Format:
- Date
- Decisions made
- Commits pushed
- Open items

---

## Session: May 2, 2026 — Skills Installation

### Decisions made
- Napkin, Caveman, Skill Forge installed into `.claude/skills/`
- Skill `.git` dirs added to `.gitignore` — skill files tracked, not their git history
- All three skills documented in `DECISIONS.md` under "Tool & Integration Decisions"

### Files created/modified
- `.claude/skills/napkin/` — persistent mistake memory per repo
- `.claude/skills/caveman/` — token optimization (~65% reduction)
- `.claude/skills/skill-forge/` — skill creator and auditor
- `.gitignore` — added `.claude/skills/{napkin,caveman,skill-forge}/.git`
- `DECISIONS.md` — new "Tool & Integration Decisions" section

### Commits pushed
- (pending)

### Open items
- Run `/caveman:compress CLAUDE.md` to compress for faster token reading
- Verify `.claude/napkin.md` created after first Napkin session
- Build cotizador-specific skills with Skill Forge (cotizador-patterns, cotizador-db, cotizador-ui)
- Run migrations `20260405000002` and `20260405000003` manually in Supabase SQL Editor
- Add Vercel env vars for Sentry
- Run a real job estimate end-to-end

### Deploy verification
- Commit: (pending)
- Tests: N/A (no source changes)
- /gstack:review: N/A (no source changes)
- Vercel: N/A

---

## Session: April 5, 2026 — Back Navigation + FAB Fix

### Decisions made
- Back arrow in estimate header navigates explicitly to `/estimates` instead of `navigate(-1)` — reliable even when there is no browser history (fresh PWA launch)
- Present screen close button navigates to `/estimates/:id/total` (explicit) instead of `navigate(-1)`

### Files modified
- `src/screens/Setup.tsx` — `onBack` → `navigate("/estimates")`
- `src/screens/Areas.tsx` — `onBack` → `navigate("/estimates")`
- `src/screens/General.tsx` — `onBack` → `navigate("/estimates")`
- `src/screens/Total.tsx` — `onBack` → `navigate("/estimates")`
- `src/screens/Present.tsx` — close button → `navigate(\`/estimates/${id}/total\`)`
- `src/screens/__tests__/Setup.test.tsx` — 2 new tests: back arrow renders, tap navigates to /estimates

### Commits pushed
- `b2c196c` fix: back arrow in estimate header navigates to /estimates explicitly

### Open items
- Write queuing (offline mutations) — deferred
- Add Vercel env vars for Sentry
- Run real job estimate end-to-end
- Setup screen QA on device

### Deploy verification
- Commit: `b2c196c`
- Tests: 269 passing
- /gstack:review: ✅ clean
- Vercel: READY ✅

---

## Session: April 5, 2026 — Math Expressions in Quantity Fields

### Decisions made
- All qty inputs accept arithmetic expressions (+, -, *, /, parentheses) — evaluated on blur via mathjs
- Invalid expressions flash red border for 1.5 s then revert to previous valid value
- `type="text"` + `inputMode="decimal"` keeps numeric mobile keyboard while allowing expression strings
- `useCalcInput` hook + `CalcInput` component — component pattern necessary to use hooks inside .map() lists
- Supabase always receives the evaluated number, never the raw expression string

### Files created/modified
- `src/hooks/useCalcInput.ts` — new hook
- `src/components/ui/CalcInput.tsx` — new component (wraps hook for use in item lists)
- `src/hooks/__tests__/useCalcInput.test.ts` — 12 tests
- `src/components/modules/PrepTab.tsx` — CalcInput on qty
- `src/components/modules/DemoTab.tsx` — CalcInput on qty
- `src/components/modules/CleaningTab.tsx` — CalcInput on existing-item qty + addForm qty
- `src/components/modules/EquipmentTab.tsx` — CalcInput inside QtyControl
- `src/components/modules/DryingChambers.tsx` — CalcInput on L/W/H inputs
- `package.json` — mathjs added

### Commits pushed
- (pending)

### Open items
- Run migrations `20260405000002` and `20260405000003` manually in Supabase SQL Editor
- Add Vercel env vars for Sentry
- Run a real job estimate end-to-end

### Deploy verification
- Tests: 295 passing
- /gstack:review: ✅ clean
- Vercel: pending

---

## Session: April 5, 2026 — Status Flow, Drying Chambers, PDF, Customer Signature

### Decisions made
- Status flow: Draft → Approved → Invoiced, no backwards transitions. Confirmation BottomSheet + toast on Total screen. Status badge in AppHeader (64px height when present).
- Drying Chambers UI: per-area L×W×H inputs → CF → dehumidifier count. When chambers exist, their total CF overrides the IICRC floor-area formula. `onDehumCountChange(null)` signals fallback to IICRC.
- PDF: `MODULE_DISPLAY_ORDER = ["GEN","PREP","DEM","CLN","EQP"]` fixes module ordering. WTR items merged into GEN. Signature section appended (base64 image or blank approval line).
- Customer signature: react-signature-canvas finger/stylus pad in Present screen. Saves base64 PNG to `customer_signature_url`, sets `approved_at`, flips status to `approved`. Shows read-only signature when already signed.
- Desktop: [···] overflow menu in DesktopEstimateDetail for status transitions + delete + PDF download.
- Back navigation: all estimate screens navigate to `/estimates` (not `navigate(-1)`) for PWA reliability.

### Files created/modified
- `src/components/layout/AppHeader.tsx` — statusBadge prop
- `src/screens/Total.tsx` — full status flow UI
- `src/screens/Present.tsx` — signature pad + success screen
- `src/screens/EstimatesList.tsx` — chip-style status badges
- `src/pdf/EstimatePDF.tsx` — PREP module, display order, signature section
- `src/components/modules/DryingChambers.tsx` — new component
- `src/components/modules/EquipmentTab.tsx` — DryingChambers integration
- `src/pages/desktop/DesktopEstimateDetail.tsx` — overflow menu, delete, PDF
- `src/locales/en.json` — status, dryingChambers, present, total strings
- `supabase/migrations/20260405000002_drying_chambers_dimensions.sql`
- `supabase/migrations/20260405000003_customer_signature.sql`
- `docs/SPEC-status-flow.md`, `docs/SPEC-customer-signature.md`
- `src/components/modules/__tests__/DryingChambers.test.tsx` — 7 tests
- `src/screens/__tests__/TotalStatusFlow.test.tsx` — 7 tests

### Commits pushed
- `b2c196c` fix: back navigation — all estimate screens navigate to /estimates
- `c979a88` feat: status flow, drying chambers, PDF fixes, customer signature

### Open items
- Run migrations `20260405000002` and `20260405000003` manually in Supabase SQL Editor
- Add Vercel env vars for Sentry (VITE_SENTRY_DSN etc.)
- Run a real job estimate end-to-end to validate pricing and formulas
- Setup screen QA on device

### Deploy verification
- Commit: c979a88
- Tests: 283 passing
- /gstack:review: ✅ clean
- Vercel: pending

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

## Session: April 5, 2026 — Service Worker Caching

### Decisions made
- Cache First for static assets (JS, CSS, fonts, images) via Workbox 7 CDN
- Network First for Supabase API — 5s timeout, 1hr cache fallback, 100 entry max
- Cache version `v1` — old caches purged on activate
- Write queuing deferred — offline mode is read-only for now
- OfflineBanner: yellow fixed banner at top, listens to online/offline events, informational only

### Files created
- `src/components/OfflineBanner.tsx` — online/offline event listener, yellow banner
- `src/components/__tests__/OfflineBanner.test.tsx` — 4 tests

### Files modified
- `public/sw.js` — replaced pass-through with Workbox 7 Cache First + Network First strategy
- `src/App.tsx` — `<OfflineBanner />` added above `<Routes>`
- `DECISIONS.md` — service worker caching strategy recorded

### Commits pushed
- `54cd60c` feat: service worker caching + OfflineBanner — Workbox 7 Cache First/Network First

### Open items
- Write queuing (offline mutations) — deferred, complex
- Manual QA: Chrome DevTools → Application → Service Workers → check Offline → reload
- Run real job estimate end-to-end
- Setup screen QA on device
- Add Vercel env vars for Sentry

### Deploy verification
- Commit: `54cd60c`
- Tests: 267 passing
- /gstack:review: ✅ clean
- Vercel: READY ✅

---

## Session: April 5, 2026 — CLAUDE.md Split

### Decisions made
- CLAUDE.md was 169 lines — split into 4 files per the >150 line rule
- No content changed, only reorganized

### Files created
- `docs/ARCHITECTURE.md` — Mobile vs Desktop split, device routing, route structure, navigation paths
- `docs/MODULES.md` — Module architecture, Prep vs General distinction, Material Selection Logic, area pre-loading table
- `docs/CALCULATIONS.md` — Flood Cut logic, IICRC S500 formulas, supervision tiers, emergency fee, disinfectant rule, containment auto-zipper

### Files modified
- `CLAUDE.md` — trimmed to 91 lines; now references all 3 domain docs; "Read..." instruction added as first line

### Standard first line for all future prompts
```
Read CLAUDE.md, docs/ARCHITECTURE.md, docs/MODULES.md, docs/CALCULATIONS.md, DECISIONS.md, and CHANGELOG.md before making any changes.
```

### Commits pushed
- `386b88a` docs: split CLAUDE.md into domain files (169 → 91 lines)

### Open items
- (same as previous session)

### Deploy verification
- Commit: `386b88a`
- Tests: 263 passing
- /gstack:review: ✅ clean
- Vercel: READY ✅

---

## Session: April 5, 2026 — RLS Policy Table Name Fix

### Decisions made
- User profiles table is `users`, NOT `profiles` — documented in CLAUDE.md to prevent recurrence
- No source code changes needed (DesktopSuggestionRules.tsx never queried `profiles`)

### Bugs fixed
- `docs/SPEC-suggestion-rules.md` migration SQL referenced `profiles` — corrected to `users`

### Files modified
- `docs/SPEC-suggestion-rules.md` — RLS policy SQL: profiles → users
- `CLAUDE.md` — "Supabase table names" note added: always use `users`, never `profiles`

### Commits pushed
- `e60656e` fix: RLS policy uses users table not profiles + CLAUDE.md note

### Open items
- (same as previous session)

### Deploy verification
- Commit: `e60656e`
- Tests: 263 passing
- /gstack:review: ✅ clean
- Vercel: READY ✅

---

## Session: April 5, 2026 — Suggestion Rules Manager

### Decisions made
- DB-driven admin UI + hardcoded fallback coexist: field app keeps reading demoItems.ts,
  admin UI reads/writes suggestion_rules table — no field app risk
- Item catalog for dropdowns: ALL_DEMO_ITEMS + ALL_PREP_ITEMS combined (~39 items),
  sorted alphabetically by name
- Auto-save on every change (same pattern as Setup screen): selects/toggles immediate,
  number inputs on blur
- Duplicate prevention: suggested_item_code options disabled if already in list for that trigger
- Delete last suggestion for a trigger → trigger disappears from left panel (correct)
- Spec doc at docs/SPEC-suggestion-rules.md

### Files created
- `docs/SPEC-suggestion-rules.md` — spec written before implementation
- `src/pages/desktop/DesktopSuggestionRules.tsx` — two-panel admin page
- `src/pages/desktop/__tests__/DesktopSuggestionRules.test.tsx` — 7 tests

### Files modified
- `src/components/desktop/DesktopSidebar.tsx` — Zap icon added for Suggestion Rules
- `src/App.tsx` — `/desktop/admin/suggestion-rules` route (requireOwner)
- `DECISIONS.md` — DB-driven + hardcoded fallback decision

### Commits pushed
- `b727b73` feat: Suggestion Rules Manager — /desktop/admin/suggestion-rules

### Open items
- Apply migration SQL to Supabase if suggestion_rules table doesn't exist yet
  (use Supabase MCP in claude.ai to check)
- Future: migrate field app (Demo.tsx, Prep.tsx) to read from DB at runtime
- Add Vercel env vars for Sentry
- Run real job estimate end-to-end
- Setup screen QA on device
- Service worker caching strategy (deferred)

### Deploy verification
- Commit: `b727b73`
- Tests: 263 passing
- /gstack:review: ✅ clean
- Vercel: READY ✅

---

## Session: April 5, 2026 — Desktop UI QA Fixes

### Decisions made
- "+ New Estimate" on desktop shows toast "Create estimates from the mobile app" — no full desktop create flow
- Table card overflow: `overflow: hidden` → `overflowX: auto` to allow all 8 columns to show without clipping
- `DesktopShell` main: removed inner `overflowY: auto` — page scrolls naturally via window, no inner scroll context

### Bugs fixed
- 🔴 "+ New Estimate" button navigated to `/estimates/new` (mobile screen) — fixed with toast
- 🟡 Table card clipped columns at narrow desktop widths — fixed with `overflowX: auto`
- 🟡 GeneralTab showed empty `<table>` when no items — fixed with empty state paragraph
- 🟡 DesktopShell main inner scroll context could conflict with fixed sidebar — removed

### QA results — everything else was clean
- ✅ Table full-width at 1280px+
- ✅ All 8 columns visible: Client, ID, Type, Category, Date, Total, Status, Actions
- ✅ Row hover (light blue background) works
- ✅ Search filters by name, address, ID
- ✅ Status badges: Draft=gray, Approved=green, Invoiced=blue
- ✅ All 4 tabs render: Overview, Areas, General, Total
- ✅ Overview 60/40 two-column layout
- ✅ Area cards grid with hover states
- ✅ AreaSlideOver opens on area card click, 480px panel, closes on backdrop click
- ✅ Total tab breakdown + Present to Client button
- ✅ Breadcrumb "Estimates /" links back to /desktop/estimates
- ✅ Sidebar exactly 64px, active icon blue, avatar shows user initial
- ✅ No overflow or layout shift at 1024px+

### Commits pushed
- `e9aa682` fix: desktop UI QA — New Estimate toast, table overflow, general empty state

### Open items
- Desktop UI QA on real wide screen ✅ done
- Add Vercel env vars for Sentry (VITE_SENTRY_DSN etc.)
- Run a real job estimate end-to-end to validate pricing
- Setup screen QA on device
- Suggestion Rules Manager — Admin desktop UI
- Service worker caching strategy (deferred)

### Deploy verification
- Commit: `e9aa682`
- Tests: 256 passing
- /gstack:review: ✅ clean
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
