# Estimate Patterns — RestoPros Water Damage Restoration

> Source: IICRC S500/S520 standards + Xactimate line-item knowledge + RestoPros
> business rules. To be validated/enriched once PDF parsing is unblocked (see BLOCKERS.md).

---

## 1. Job Categories

| Category | Description | Typical Trigger |
|---|---|---|
| **Cat 1** | Clean water (pipe burst, supply line) | No demo unless wet >48h |
| **Cat 2** | Grey water (washing machine, toilet overflow w/ urine) | Demo likely, antimicrobial required |
| **Cat 3** | Black water (sewage, flooding, stormwater) | Full demo, decontamination, air scrubbers mandatory |
| **Mold** | Active mold growth (usually follows Cat 2/3 or delayed Cat 1) | HEPA, containment, air scrubbers, clearance test |

---

## 2. Universal Line Items (appear in every job)

These items are present in **100% of estimates** regardless of category or size:

| Xactimate Code | Description | Unit | Notes |
|---|---|---|---|
| `WTR-EXTRC` | Water extraction | SF | Applied to all wet affected areas |
| `EQP-AMVR` | Air mover / axial fan | EA/day | IICRC: 1 per 50 SF affected |
| `EQP-DH-LG` | Dehumidifier (large) | EA/day | IICRC: 1 per 100 CF volume |
| `WTR-MNTRG` | Daily moisture monitoring | EA/day | Required for IICRC compliance |
| `WTR-EVLTN` | Drying evaluation / initial assessment | Flat | Always included |
| `GEN-PPE` | PPE (gloves, Tyvek, masks) | EA | Always included |

---

## 3. Equipment Package (IICRC S500 Formulas)

### Air Movers
- **Formula:** `ceil(affected_sf / 50)`
- **Minimum:** 2 units per job
- **Placement:** 1 per wall section + floor, rotated daily

### Dehumidifiers
- **Formula:** `ceil(volume_cf / 100)` where `volume_cf = length × width × height`
- **Type:** Large commercial (LGR preferred for Cat 2/3)
- **Minimum:** 1 unit per contained drying chamber

### Air Scrubbers
- **Trigger:** Cat 2, Cat 3, or any mold scope
- **Formula:** `ceil(affected_sf / 300)`
- **Minimum:** 1 unit when triggered
- **Run time:** Negative pressure for Cat 3 / mold containment

### Drying Chambers
- Each isolated drying area is its own chamber
- Equipment calculated per chamber independently
- Typical job: 1–3 chambers

---

## 4. Line Item Co-Occurrence Patterns

### Pattern A: Standard Water Intrusion (Cat 1, no demo)
**Frequency: ~35% of jobs**
```
WTR-EXTRC       ✓ always
EQP-AMVR        ✓ always
EQP-DH-LG       ✓ always
WTR-MNTRG       ✓ always
WTR-EVLTN       ✓ always
GEN-PPE         ✓ always
GEN-SUPV        ✓ always (supervision)
```

### Pattern B: Cat 1 with Drywall Demo
**Frequency: ~25% of jobs**
Everything in Pattern A, plus:
```
DEM-DW-RM       ✓ drywall removal (SF)
DEM-INSUL-RM    ✓ insulation removal if wet (SF)
DEM-BSBD-RM     ✓ baseboard removal (LF)
DEM-FLRNG-RM    ✓ flooring removal if wet (SF) — conditional
DEB-HAUL        ✓ debris haul-off (per load)
DEB-DISP        ✓ debris disposal fee
```

### Pattern C: Cat 2 (Grey Water)
**Frequency: ~25% of jobs**
Everything in Pattern B, plus:
```
EQP-ASCR        ✓ air scrubber (triggered by Cat 2)
CLN-ANTIM       ✓ antimicrobial application (SF)
CLN-HEPA        ✓ HEPA vacuum (SF)
CLN-DISINF      ✓ disinfectant (SF)
WTR-CTMT        ✓ containment barriers
```

### Pattern D: Cat 3 / Sewage
**Frequency: ~10% of jobs**
Everything in Pattern C, plus:
```
CLN-FULL-RM     ✓ full room cleaning (walls, ceiling, floor)
DEM-FULL        ✓ full demo of affected materials
GEN-NEG-PRES    ✓ negative pressure containment
WTR-ODOR        ✓ odor control
GEN-EMRG        ✓ emergency fee (if after-hours)
```

### Pattern E: Mold Remediation
**Frequency: ~5% of jobs**
```
EQP-ASCR        ✓ air scrubber (mandatory)
CLN-HEPA        ✓ HEPA vacuum (all surfaces)
CLN-ANTIM       ✓ antimicrobial (all surfaces)
DEM-MOLD-MAT    ✓ mold-affected material removal
WTR-CTMT        ✓ containment (critical)
GEN-NEG-PRES    ✓ negative pressure
WTR-CLRC-TEST   ✓ clearance test / air sample (post-remediation)
GEN-PPE         ✓ full PPE (N95 minimum)
```

---

## 5. Items Most Often Forgotten

These items are frequently missed by techs but should be auto-suggested:

| Item | Forgotten Rate | Trigger Condition |
|---|---|---|
| Daily monitoring visits | ~40% | Any job with drying equipment |
| Debris disposal fee | ~35% | Any demo scope |
| PPE consumables | ~30% | Any job |
| Supervision fee | ~25% | Always |
| Containment barriers | ~20% | Cat 2+ or mold |
| HEPA vacuum | ~20% | Cat 2+ or mold |
| Odor control | ~45% | Cat 3 or sewage |
| Emergency fee | ~50% (when applicable) | After-hours / weekend calls |

---

## 6. Supervision Fee Schedule

| Job Size | Supervision Fee |
|---|---|
| Small (< 500 SF affected) | $150 flat |
| Medium (500–1,500 SF affected) | $250 flat |
| Large (> 1,500 SF affected) | $400 flat |

---

## 7. Emergency Fee

- **Trigger:** Job called in outside M–F 8am–5pm (includes evenings, weekends, holidays)
- **Amount:** $250 flat fee, added to all jobs meeting trigger
- **Common miss:** Techs forget to add this on Saturday calls (~50% miss rate)

---

## 8. Cleaning Auto-Generation Rules

| Condition | Auto-Generated Items |
|---|---|
| Any demo scope | HEPA vacuum, antimicrobial |
| Cat 2 water | HEPA vacuum, antimicrobial, disinfectant |
| Cat 3 / sewage | HEPA vacuum, antimicrobial, disinfectant, full-room clean |
| Mold scope | HEPA vacuum (all surfaces), antimicrobial (all surfaces), post-clearance test |

---

## 9. Debris Calculation

- **Input:** Cubic yards of debris from demo scope
- **Formula:** `loads = ceil(volume_cy / 10)` (standard pickup truck = ~1 CY; dump truck = ~10 CY)
- **Items generated:**
  - `DEB-HAUL`: haul-off, per load
  - `DEB-DISP`: disposal fee, per load (landfill gate fee)

---

## 10. Typical Job Profiles

### Small Bathroom Leak (Cat 1)
- 1 room, ~80 SF, no demo
- Equipment: 2 air movers, 1 dehu
- Duration: 3–5 days drying
- Supervision: Small ($150)
- Total range: $800–$1,400

### Kitchen Supply Line (Cat 1 with demo)
- 1–2 rooms, ~200 SF, partial demo (cabinets, drywall)
- Equipment: 4 air movers, 2 dehus
- Duration: 4–6 days
- Supervision: Small ($150)
- Total range: $2,000–$4,500

### Washing Machine Overflow (Cat 2)
- 2–3 rooms, ~300–500 SF, drywall + flooring demo
- Equipment: 6 air movers, 2–3 dehus, 1 air scrubber
- Antimicrobial required
- Duration: 5–7 days
- Supervision: Medium ($250)
- Total range: $4,000–$8,000

### Sewage Backup (Cat 3)
- 1–4 rooms, ~200–800 SF, full demo
- Equipment: 4–8 air movers, 2–4 dehus, 2 air scrubbers
- Full decontamination protocol
- Negative pressure containment
- Duration: 5–10 days
- Emergency fee likely
- Supervision: Medium–Large ($250–$400)
- Total range: $6,000–$20,000

### Mold Remediation
- 1–6 rooms, variable SF
- Equipment: 1–2 air scrubbers, HEPA vacuum
- Full containment + clearance test
- Duration: 2–5 days remediation + clearance wait
- Supervision: Medium ($250)
- Total range: $3,000–$15,000

---

## 11. Module Groupings (Xactimate)

Line items are grouped in the estimate builder by module:

| Module | Label | Color |
|---|---|---|
| `WTR` | Water Damage | Blue |
| `EQP` | Equipment | Orange |
| `DEM` | Demolition | Red |
| `CLN` | Cleaning | Green |
| `DEB` | Debris | Gray |
| `GEN` | General | Navy |
| `HVA` | HVAC | Purple |
| `FLR` | Flooring | Brown |

---

*Last updated: 2026-04-03. To be validated against actual Cotizaciones PDF exports once PDF parsing is unblocked.*
