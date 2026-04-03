# Changelog — Cotizador RestoPros

## How to use
Every development session adds an entry. Format:
- Date
- Decisions made
- Commits pushed
- Open items

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
- Total screen review — not yet tested end-to-end
- Present-to-client view — not yet tested
- PDF output — not yet tested on a real estimate

---

## Template for future sessions

## Session: [DATE]

### Decisions made
-

### Commits pushed
-

### Open items
-
