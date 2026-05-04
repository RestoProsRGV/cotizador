export interface PriceItem {
  code: string;
  description: string;
  unit: string;
  unit_price: number;
  category: "equipment" | "water" | "general" | "cleaning" | "demo" | "prep";
}

export const HARDCODED_PRICES: Record<string, PriceItem> = {
  // Equipment
  "EQP-AMVR": { code: "EQP-AMVR", description: "Air Mover", unit: "DAY", unit_price: 15, category: "equipment" },
  "EQP-DH-LG": { code: "EQP-DH-LG", description: "Dehumidifier - Large", unit: "DAY", unit_price: 50, category: "equipment" },
  "EQP-ASCR": { code: "EQP-ASCR", description: "Air Scrubber", unit: "DAY", unit_price: 30, category: "equipment" },

  // Water / Evaluation
  "WTR-EVLTN": { code: "WTR-EVLTN", description: "Water Damage Evaluation", unit: "EA", unit_price: 150, category: "water" },
  "WTR-ODOR": { code: "WTR-ODOR", description: "Odor Control Treatment", unit: "SF", unit_price: 0.20, category: "water" },
  "WTR-CLRC-TEST": { code: "WTR-CLRC-TEST", description: "Clearance Testing", unit: "EA", unit_price: 350, category: "water" },

  // General
  "GEN-PPE": { code: "GEN-PPE", description: "Personal Protective Equipment", unit: "EA", unit_price: 50, category: "general" },
  "GEN-HAUL": { code: "GEN-HAUL", description: "Haul Debris", unit: "LOAD", unit_price: 95, category: "general" },
  "GEN-DISP": { code: "GEN-DISP", description: "Disposal Fee", unit: "EA", unit_price: 75, category: "general" },
  "GEN-EMRG": { code: "GEN-EMRG", description: "Emergency Service Fee", unit: "EA", unit_price: 250, category: "general" },
  "GEN-SUPV": { code: "GEN-SUPV", description: "Supervision / Project Management", unit: "EA", unit_price: 250, category: "general" },

  // Cleaning
  "CLN-HEPA": { code: "CLN-HEPA", description: "HEPA Vacuum", unit: "SF", unit_price: 0.35, category: "cleaning" },
  "CLN-ANTIM": { code: "CLN-ANTIM", description: "Antimicrobial Treatment", unit: "SF", unit_price: 0.25, category: "cleaning" },
  "CLN-DISINF": { code: "CLN-DISINF", description: "Disinfectant Application", unit: "SF", unit_price: 0.15, category: "cleaning" },
  "CLN-FULL-RM": { code: "CLN-FULL-RM", description: "Full Room Cleaning", unit: "SF", unit_price: 0.45, category: "cleaning" },

  // Demo - walls / structure
  "DEM-DW-RM": { code: "DEM-DW-RM", description: "Drywall Removal", unit: "SF", unit_price: 0.50, category: "demo" },
  "DEM-INSUL-RM": { code: "DEM-INSUL-RM", description: "Insulation Removal", unit: "SF", unit_price: 0.45, category: "demo" },
  "DEM-BSBD-RM": { code: "DEM-BSBD-RM", description: "Baseboard Removal", unit: "LF", unit_price: 1.50, category: "demo" },
  "DEM-FLOOD-CUT": { code: "DEM-FLOOD-CUT", description: "Drywall Flood Cut", unit: "LF", unit_price: 1.00, category: "demo" },
  "DEM-FLOOD-CUT-2FT": { code: "DEM-FLOOD-CUT-2FT", description: "Drywall Flood Cut 2ft", unit: "LF", unit_price: 1.00, category: "demo" },
  "DEM-FLOOD-CUT-4FT": { code: "DEM-FLOOD-CUT-4FT", description: "Drywall Flood Cut 4ft", unit: "LF", unit_price: 1.50, category: "demo" },
  "DEM-CAVITY-DRILL": { code: "DEM-CAVITY-DRILL", description: "Wall Cavity Drill", unit: "EA", unit_price: 5.00, category: "demo" },

  // Demo - trim
  "DEM-DOOR-CASE-RM": { code: "DEM-DOOR-CASE-RM", description: "Door Casing Removal", unit: "LF", unit_price: 1.25, category: "demo" },
  "DEM-THRESH-RM": { code: "DEM-THRESH-RM", description: "Threshold Removal", unit: "EA", unit_price: 10.00, category: "demo" },

  // Demo - flooring
  "DEM-CARP-RM": { code: "DEM-CARP-RM", description: "Carpet Removal", unit: "SF", unit_price: 0.35, category: "demo" },
  "DEM-CARP-PAD-RM": { code: "DEM-CARP-PAD-RM", description: "Carpet Pad Removal", unit: "SF", unit_price: 0.15, category: "demo" },
  "DEM-HW-RM": { code: "DEM-HW-RM", description: "Hardwood Removal", unit: "SF", unit_price: 1.50, category: "demo" },
  "DEM-TILE-RM": { code: "DEM-TILE-RM", description: "Tile Removal", unit: "SF", unit_price: 2.00, category: "demo" },
  "DEM-LAM-RM": { code: "DEM-LAM-RM", description: "Laminate Removal", unit: "SF", unit_price: 0.75, category: "demo" },
  "DEM-VNL-RM": { code: "DEM-VNL-RM", description: "Vinyl/LVP Removal", unit: "SF", unit_price: 0.50, category: "demo" },
  "DEM-SUBFLR-RM": { code: "DEM-SUBFLR-RM", description: "Subfloor Removal", unit: "SF", unit_price: 1.00, category: "demo" },

  // Demo - plumbing
  "DEM-VAN-RM": { code: "DEM-VAN-RM", description: "Vanity Removal", unit: "EA", unit_price: 45, category: "demo" },
  "DEM-TOILET-DR": { code: "DEM-TOILET-DR", description: "Toilet Detach & Reset", unit: "EA", unit_price: 65, category: "demo" },
  "DEM-SINK-DR": { code: "DEM-SINK-DR", description: "Sink Detach & Reset", unit: "EA", unit_price: 45, category: "demo" },
  "DEM-FAUC-DR": { code: "DEM-FAUC-DR", description: "Faucet Detach & Reset", unit: "EA", unit_price: 35, category: "demo" },
  "DEM-MIRROR-RM": { code: "DEM-MIRROR-RM", description: "Mirror Removal", unit: "EA", unit_price: 25, category: "demo" },

  // Demo - cabinets
  "DEM-BC-RM": { code: "DEM-BC-RM", description: "Base Cabinet Removal", unit: "LF", unit_price: 18, category: "demo" },
  "DEM-UC-RM": { code: "DEM-UC-RM", description: "Upper Cabinet Removal", unit: "LF", unit_price: 14, category: "demo" },
  "DEM-CTOP-RM": { code: "DEM-CTOP-RM", description: "Countertop Removal", unit: "LF", unit_price: 8, category: "demo" },

  // Demo - ceiling
  "DEM-CEIL-DW-RM": { code: "DEM-CEIL-DW-RM", description: "Ceiling Drywall Removal", unit: "SF", unit_price: 0.55, category: "demo" },
  "DEM-CEIL-ACT-RM": { code: "DEM-CEIL-ACT-RM", description: "Acoustic Tile Removal", unit: "SF", unit_price: 0.45, category: "demo" },
  "DEM-CEIL-INSUL-RM": { code: "DEM-CEIL-INSUL-RM", description: "Ceiling Insulation Removal", unit: "SF", unit_price: 0.45, category: "demo" },

  // Prep - floor protection
  "PREP-FLOOR-PLASTIC": { code: "PREP-FLOOR-PLASTIC", description: "Floor Protection - Plastic & Tape", unit: "SF", unit_price: 0.20, category: "prep" },
  "PREP-COVER-PLASTIC": { code: "PREP-COVER-PLASTIC", description: "Protect - Cover with Plastic", unit: "SF", unit_price: 0.15, category: "prep" },

  // Prep - contents
  "PREP-CONTENT-MANIP": { code: "PREP-CONTENT-MANIP", description: "Content Manipulation", unit: "HR", unit_price: 45, category: "prep" },

  // Prep - containment
  "PREP-CONTAIN-BARRIER": { code: "PREP-CONTAIN-BARRIER", description: "Containment Barrier/Airlock", unit: "SF", unit_price: 0.85, category: "prep" },
  "PREP-ZIPPER": { code: "PREP-ZIPPER", description: "Peel & Seal Zipper", unit: "EA", unit_price: 12, category: "prep" },
  "PREP-TENSION-POSTS": { code: "PREP-TENSION-POSTS", description: "Containment Tension Posts", unit: "EA", unit_price: 8, category: "prep" },

  // Prep - appliances
  "PREP-WASHER-DR": { code: "PREP-WASHER-DR", description: "Washer Detach", unit: "EA", unit_price: 35, category: "prep" },
  "PREP-DRYER-DR": { code: "PREP-DRYER-DR", description: "Dryer Detach", unit: "EA", unit_price: 35, category: "prep" },
  "PREP-FRIDGE-DR": { code: "PREP-FRIDGE-DR", description: "Refrigerator Detach", unit: "EA", unit_price: 45, category: "prep" },
  "PREP-DW-DR": { code: "PREP-DW-DR", description: "Dishwasher Detach", unit: "EA", unit_price: 40, category: "prep" },
  "PREP-RANGE-DR": { code: "PREP-RANGE-DR", description: "Range/Stove Detach", unit: "EA", unit_price: 45, category: "prep" },

  // Prep - fixtures
  "PREP-LIGHT-DR": { code: "PREP-LIGHT-DR", description: "Light Fixture Detach", unit: "EA", unit_price: 25, category: "prep" },
  "PREP-AC-REG-DR": { code: "PREP-AC-REG-DR", description: "AC Register Detach", unit: "EA", unit_price: 15, category: "prep" },
};

export function getHardcodedPrice(code: string): number {
  return HARDCODED_PRICES[code]?.unit_price ?? 0;
}
