/**
 * Default prices for all line item codes.
 * Used since price_items table is empty.
 * Prices are per unit as specified.
 */
export const DEFAULT_PRICES: Record<string, number> = {
  // Equipment
  "EQP-AMVR": 15,        // per day
  "EQP-DH-LG": 50,       // per day
  "EQP-ASCR": 30,        // per day

  // Water / General
  "WTR-EVLTN": 150,      // flat
  "GEN-PPE": 50,         // EA
  "GEN-EMRG": 250,       // flat
  "GEN-SUPV": 250,       // flat (overridden by supervision fee logic)

  // Cleaning
  "CLN-HEPA": 0.35,      // SF
  "CLN-ANTIM": 0.25,     // SF
  "CLN-DISINF": 0.15,    // SF
  "CLN-FULL-RM": 0.45,   // SF
  "WTR-ODOR": 0.20,      // SF
  "WTR-CLRC-TEST": 350,  // EA

  // Demo - walls/structure
  "DEM-DW-RM": 0.50,     // SF
  "DEM-INSUL-RM": 0.45,  // SF
  "DEM-BSBD-RM": 1.50,   // LF
  "DEM-FLOOD-CUT": 1.00, // LF

  // Demo - flooring
  "DEM-CARP-RM": 0.35,   // SF
  "DEM-CARP-PAD-RM": 0.15, // SF
  "DEM-HW-RM": 1.50,     // SF
  "DEM-TILE-RM": 2.00,   // SF
  "DEM-LAM-RM": 0.75,    // SF
  "DEM-VNL-RM": 0.50,    // SF
  "DEM-SUBFLR-RM": 1.00, // SF

  // Demo - plumbing
  "DEM-VAN-RM": 45,      // EA
  "DEM-TOILET-DR": 65,   // EA
  "DEM-SINK-DR": 45,     // EA
  "DEM-FAUC-DR": 35,     // EA
  "DEM-MIRROR-RM": 25,   // EA

  // Demo - cabinets
  "DEM-BC-RM": 18,       // LF
  "DEM-UC-RM": 14,       // LF
  "DEM-CTOP-RM": 8,      // LF

  // Demo - ceiling
  "DEM-CEIL-DW-RM": 0.55,   // SF
  "DEM-CEIL-ACT-RM": 0.45,  // SF
  "DEM-CEIL-INSUL-RM": 0.45, // SF
};

export function getPrice(code: string): number {
  return DEFAULT_PRICES[code] ?? 0;
}
