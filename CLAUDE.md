@AGENTS.md
@DECISIONS.md
@CHANGELOG.md

## How to use this project

This project has 3 documentation files that must be read before making any changes:

- `CLAUDE.md` — Technical architecture, stack, module logic, and business rules
- `DECISIONS.md` — Why every decision was made. Read this before proposing alternatives.
- `CHANGELOG.md` — What was built in each session and what is still open.

**Rule:** At the end of every session, update `CHANGELOG.md` with:
1. New decisions made
2. Commits pushed
3. New open items discovered

Never make a change that contradicts a decision in `DECISIONS.md` without first flagging it to the user.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health

## Material Selection Logic

Areas use a two-tier chip model for materials:

**Common chips** (always visible): Carpet, Tile, Wood, Vinyl/LVP (floor) | Drywall, Paneling (walls) | Drywall, Acoustic Tile (ceiling)

**More ▾ dropdown**: Less-common materials appear in a collapsed panel. When selected, they surface as chips in the main row so all selections are visible simultaneously.

**Closest match + note pattern**: Estimators always select from the catalog so the system can price the job. If the actual material isn't in the list, the estimator selects the closest match, then taps "Material not in list? Select closest match + add a note" to open a free-text note field. The note is saved as `material_note` on the area record. Area cards show a 📝 indicator when a note exists (tooltip shows the text). The owner can review discrepancies in the Areas screen before finalizing.

**Admin Materials tab** (`/admin/prices` → Materials tab): Owner can configure which materials appear as common chips vs "More" (via `is_common` toggle), add custom materials, and activate/deactivate materials. The `materials` table stores: id, tenant_id, name, category (floor/walls/ceiling), is_common, display_order, active.

## Mobile vs Desktop Architecture

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

## Flood Cut Logic

Flood cuts come in two heights, each is a separate line item with distinct codes:

| Item | Code | Unit |
|------|------|------|
| Drywall Flood Cut 2ft | `DEM-FLOOD-CUT-2FT` | LF |
| Drywall Flood Cut 4ft | `DEM-FLOOD-CUT-4FT` | LF |

**Suggestion rules** (defined via `suggestionRules` in `demoItems.ts`, applied with quantity multipliers in `Demo.tsx`):

- **Baseboard Removal** (`DEM-BSBD-RM`): always same LF as the flood cut (multiplier ×1)
- **Insulation Removal** (`DEM-INSUL-RM`): LF × height in feet (2ft → ×2 SF, 4ft → ×4 SF)

Example: 20 LF of 4ft flood cut → 20 LF baseboard + 80 SF insulation.

The `SuggestionRule` interface in `demoItems.ts` carries `qtyMultiplier?: number`. When present, `Demo.tsx` computes `Math.round(parentQty × multiplier)` instead of using `getDefaultQty()`. Items without `suggestionRules` fall back to the plain `suggestions: string[]` array with `getDefaultQty()`.

## Module Architecture

Module names use i18n keys (`nav.prep`, `nav.demo`, etc.) — may change for market launch without code changes.

**PER-AREA MODULES** (scoped to each room, stored with `area_id` in `line_items`):
- **Prep Work** — floor protection, appliances, containment, fixtures
- **Demo** — demolition/mitigation items
- **Cleaning** — auto-generated from area's demo scope
- **Equipment** — IICRC calculations from area dimensions

**PROJECT-LEVEL MODULES** (area_id = NULL in line_items):
- **General** — debris haul, PPE, supervision, emergency fee
- **Total** — sum of all areas × all modules + general

**Navigation paths:**
1. Area card → AreaDetail (`/estimates/:id/areas/:areaId`) — single area, 4-tab view
2. Bottom nav Prep/Demo/Cleaning/Equipment → area selector list → AreaDetail tab

**Area-type pre-loading rules** (from `src/constants/areaPreloads.ts`):

| Area type | Demo pre-loads | Prep pre-loads |
|-----------|---------------|----------------|
| Bathroom | Drywall, Baseboard, Vanity, Sink, Faucet, Mirror | Floor Plastic, Content Manip |
| Kitchen | Drywall, Baseboard, Cabinets, Sink, Faucet | Fridge, DW, Range, Floor Plastic |
| Laundry Room | Drywall, Baseboard | Washer, Dryer, Floor Plastic |
| Bedroom | Drywall, Baseboard | Floor Plastic |
| Living Room | Drywall, Baseboard | Floor Plastic |
| Hallway/Closet/Garage | Drywall, Baseboard | Floor Plastic |
