@AGENTS.md

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
