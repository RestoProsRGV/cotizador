# Module Business Logic

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

## Prep Work vs General

**Prep Work** is per-area: containment barrier, floor protection, appliance detach, fixture detach.
**General** is project-level: debris haul, PPE consumables, supervision fee, emergency fee.

Prep items vary by room. General items apply once to the whole job regardless of room count.

## Material Selection Logic

Areas use a two-tier chip model for materials:

**Common chips** (always visible): Carpet, Tile, Wood, Vinyl/LVP (floor) | Drywall, Paneling (walls) | Drywall, Acoustic Tile (ceiling)

**More ▾ dropdown**: Less-common materials appear in a collapsed panel. When selected, they surface as chips in the main row so all selections are visible simultaneously.

**Closest match + note pattern**: Estimators always select from the catalog so the system can price the job. If the actual material isn't in the list, the estimator selects the closest match, then taps "Material not in list? Select closest match + add a note" to open a free-text note field. The note is saved as `material_note` on the area record. Area cards show a 📝 indicator when a note exists (tooltip shows the text). The owner can review discrepancies in the Areas screen before finalizing.

**Admin Materials tab** (`/admin/prices` → Materials tab): Owner can configure which materials appear as common chips vs "More" (via `is_common` toggle), add custom materials, and activate/deactivate materials. The `materials` table stores: id, tenant_id, name, category (floor/walls/ceiling), is_common, display_order, active.

## Area-Type Pre-Loading Rules

Defined in `src/constants/areaPreloads.ts`. When an area is named, Demo and Prep pre-suggest relevant items:

| Area type | Demo pre-loads | Prep pre-loads |
|-----------|---------------|----------------|
| Bathroom | Drywall, Baseboard, Vanity, Sink, Faucet, Mirror | Floor Plastic, Content Manip |
| Kitchen | Drywall, Baseboard, Cabinets, Sink, Faucet | Fridge, DW, Range, Floor Plastic |
| Laundry Room | Drywall, Baseboard | Washer, Dryer, Floor Plastic |
| Bedroom | Drywall, Baseboard | Floor Plastic |
| Living Room | Drywall, Baseboard | Floor Plastic |
| Hallway/Closet/Garage | Drywall, Baseboard | Floor Plastic |
