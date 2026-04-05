# Calculations & Pricing Rules

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

## IICRC S500 Equipment Formulas

Always use maximum IICRC recommended quantities. Out-of-pocket clients expect thorough work.

```
Air Movers:     1 per 50 SF of floor area
Dehumidifiers:  cubic feet of drying chamber ÷ 100
Air Scrubbers:  1 per 300 SF of total affected area
```

**Equipment default:** All equipment defaults to 3 rental days (RestoPros standard; day 3 includes the drying evaluation).

## Supervision Fee Tiers

Flat fee by job size (out-of-pocket clients need simple pricing):

| Job size | Areas | Fee |
|----------|-------|-----|
| Small | 1–2 areas | $150 |
| Medium | 3–4 areas | $250 |
| Large | 5+ areas | $400 |

## Emergency Fee

Jobs outside Monday–Friday 8am–5pm automatically add a **$250 Emergency Fee** (`GEN-EMRG`).
Matches Xactimate emergency service charge rate. Configurable in Admin.

`isEmergencyCall(date)` in `src/lib/logic/general.ts` determines whether a job qualifies.

## Disinfectant Rule

Disinfectant auto-generates only for Category 2 or Category 3 jobs.
Per IICRC S500 Section 7.1, antimicrobial use is not warranted for Cat 1.
Validated against 62 real estimates (only 32% of jobs had Disinfectant).

## Containment Auto-Zipper

When Containment Barrier (`PREP-CONTAIN-BARRIER`) is added, Peel & Seal Zipper (`PREP-ZIPPER`) is automatically added (1 EA).
In 92% of real jobs analyzed, Containment and Zipper appeared together.
