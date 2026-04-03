# Changelog

Each entry covers one Claude Code session. Update at the end of every session.

---

## 2026-04-03 — Session 4: Bug fixes from user testing

### Commits pushed
- `5e2aecc` fix: per-area Demo/Cleaning/Equipment screens + containment + tests (issues 1-4)
- `35b7da7` docs: add DECISIONS.md with all business logic and architecture decisions

### What was fixed
- **Issue 1 — Demo/Cleaning/Equipment global views**: All three screens replaced with area-selector versions. Chip bar at top: [All Areas] [Bathroom] [Kitchen]. Default = All Areas with area name subtitles. Tapping chip filters to that area. Each screen delegates to DemoTab / CleaningTab / EquipmentTab.
- **Issue 2 — Cleaning duplicates**: "All Areas" mode now groups CleaningTab instances with `── AREA NAME ──` dividers. Containment barrier removed from CleaningTab auto-generation (belongs in Prep Work). Disinfectant was already correctly gated to cat2/cat3/mold.
- **Issue 3 — Equipment Days=1 / wrong dehumidifier count**: Root cause was old global Equipment.tsx picking up per-area EQP items inserted by EquipmentTab, then dividing a single area's stored quantity by the recalculated all-areas total. New per-area Equipment.tsx resolves this. Added 15 test cases documenting real job dimensions.
- **Issue 4 — General tab**: Already fixed in Session 3's EstimateNav commit.

### Tests
- 219 tests passing (up from 204)

### Open items
- None from this session

---

## 2026-04-03 — Session 3: Per-area module architecture

### Commits pushed
- `63610cb` feat: per-area module architecture — Prep/Demo/Cleaning/Equipment scoped to each area
- `7135154` feat: flood cut 2ft/4ft split, route architecture, CLAUDE.md updates
- `a3db95f` feat: Areas module — ft+in inputs, material chips redesign, material notes, admin materials

### What was built
- **Per-area architecture**: All modules except General now operate per-area. `line_items.area_id UUID NULL` = project-level; NOT NULL = area-scoped.
- **Migration 005**: `line_items.area_id UUID REFERENCES areas(id) ON DELETE CASCADE` + indexes.
- **New tab components**: `PrepTab`, `DemoTab`, `CleaningTab`, `EquipmentTab` — each accepts `estimateId + areaId + area?` props.
- **AreaDetail screen** (`/estimates/:id/areas/:areaId`): 4-tab view (Prep | Demo | Cleaning | Equipment) for a single area.
- **Prep screen** (`/estimates/:id/prep`): Area selector list → navigates to AreaDetail.
- **Area-type pre-loading**: Bathroom/Kitchen/Laundry/Bedroom pre-populate Demo and Prep items on first visit (`src/constants/areaPreloads.ts`).
- **Prep items catalog** (`src/constants/prepItems.ts`): All PREP items with sections, appliance preloads, CONTAIN-BARRIER → ZIPPER auto-insert.
- **Flood cut split**: `DEM-FLOOD-CUT` replaced by `DEM-FLOOD-CUT-2FT` (LF) and `DEM-FLOOD-CUT-4FT` (LF) with `SuggestionRule.qtyMultiplier` for insulation SF calculation.
- **EstimateNav**: Added Prep tab (Wrench icon). Fixed active-slug detection for nested routes (`/estimates/:id/areas/:areaId` correctly highlights Areas).
- **CLAUDE.md**: Added Module Architecture, Flood Cut Logic, Mobile vs Desktop Architecture sections.

### Areas module improvements (same session)
- ft+in paired dimension inputs with auto-advance
- Material chips redesigned: common chips always visible + "More ▾" expandable dropdown
- "Closest match + note" flow: `material_note` saved on area record, 📝 indicator on area cards
- Admin Materials tab in AdminPrices: configure is_common, add materials, activate/deactivate
- Migration 004: `areas.material_note TEXT` + `materials` table with RLS

### Tests
- 204 tests passing

### Open items resolved in Session 4
- Demo/Cleaning/Equipment still showed global views after this session — fixed in Session 4.

---

## 2026-04-03 — Session 2: Infrastructure (Tasks 1–5)

### Commits pushed
- `6b41cec` test: Task 5 — 188 unit tests across all infrastructure modules
- `64b86a2` feat: Task 4 — PDF generation with @react-pdf/renderer
- `2a98299` feat: Task 3 — Admin Price Management with Xactimate XLSX parser
- *(Tasks 1 & 2 committed earlier in session)*

### What was built
- **Task 1 — Auth**: `AuthContext`, `RequireAuth`, Login screen with Supabase email/password.
- **Task 2 — Estimates List**: `/estimates` screen with list + new estimate flow.
- **Task 3 — Admin Prices**: `/admin/prices` XLSX parser for Xactimate Cat+Sel → price code mapping. Later extended with Materials tab (Session 3).
- **Task 4 — PDF Generation**: `useEstimatePDF` hook with `@react-pdf/renderer`, covers all modules.
- **Task 5 — Tests**: 188 Vitest unit tests across auth, estimates, cleaning logic, equipment formulas, recalculation, demo suggestions, area calculations.

### Tests
- 188 tests passing

---

## 2026-04-03 — Session 1: Planning

### What happened
- CEO review and engineering architecture review completed.
- Project scaffolded: React 18 + Vite + TypeScript + Tailwind CSS v4 + Supabase + React Router v6.
- Supabase schema defined: `tenants`, `users`, `estimates`, `areas`, `line_items`, `prices`, `materials`.
- Migrations 001–003 applied.
- CLAUDE.md, AGENTS.md, DESIGN.md, ESTIMATE_PATTERNS.md created.
