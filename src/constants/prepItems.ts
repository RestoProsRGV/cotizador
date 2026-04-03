import type { DemoItemDef, DemoSection } from "./demoItems";

// Re-use DemoItemDef for Prep items (same shape: code, name, unit, suggestions)
// Prep uses module "PREP" in line_items

export const PREP_FLOOR_PROTECTION: DemoItemDef[] = [
  { code: "PREP-FLOOR-PLASTIC", name: "Floor Protection - Plastic & Tape", unit: "SF", suggestions: [] },
  { code: "PREP-COVER-PLASTIC", name: "Protect - Cover with Plastic", unit: "SF", suggestions: [] },
];

export const PREP_CONTENTS: DemoItemDef[] = [
  { code: "PREP-CONTENT-MANIP", name: "Content Manipulation", unit: "HR", suggestions: [] },
];

export const PREP_CONTAINMENT: DemoItemDef[] = [
  {
    code: "PREP-CONTAIN-BARRIER",
    name: "Containment Barrier/Airlock",
    unit: "SF",
    suggestions: ["PREP-ZIPPER"],
    // When added, auto-accept Peel & Seal Zipper at qty=1
  },
  { code: "PREP-ZIPPER", name: "Peel & Seal Zipper", unit: "EA", suggestions: [] },
  { code: "PREP-TENSION-POSTS", name: "Containment Tension Posts", unit: "EA", suggestions: [] },
];

export const PREP_APPLIANCES: DemoItemDef[] = [
  { code: "PREP-WASHER-DR", name: "Washer Detach", unit: "EA", suggestions: [] },
  { code: "PREP-DRYER-DR", name: "Dryer Detach", unit: "EA", suggestions: [] },
  { code: "PREP-FRIDGE-DR", name: "Refrigerator Detach", unit: "EA", suggestions: [] },
  { code: "PREP-DW-DR", name: "Dishwasher Detach", unit: "EA", suggestions: [] },
  { code: "PREP-RANGE-DR", name: "Range/Stove Detach", unit: "EA", suggestions: [] },
];

export const PREP_FIXTURES: DemoItemDef[] = [
  { code: "PREP-LIGHT-DR", name: "Light Fixture Detach", unit: "EA", suggestions: [] },
  { code: "PREP-AC-REG-DR", name: "AC Register Detach", unit: "EA", suggestions: [] },
];

// Which appliances to show based on area name (case-insensitive includes match)
export const APPLIANCE_AREA_MAP: Record<string, string[]> = {
  "laundry": ["PREP-WASHER-DR", "PREP-DRYER-DR"],
  "kitchen": ["PREP-FRIDGE-DR", "PREP-DW-DR", "PREP-RANGE-DR"],
};

export function getAppliancesForArea(areaName: string): DemoItemDef[] {
  const lower = areaName.toLowerCase();
  const codes: string[] = [];
  Object.entries(APPLIANCE_AREA_MAP).forEach(([key, vals]) => {
    if (lower.includes(key)) codes.push(...vals);
  });
  if (codes.length === 0) return [];
  return PREP_APPLIANCES.filter(a => codes.includes(a.code));
}

export interface PrepSection {
  id: string;
  labelKey: string;
  items: DemoItemDef[];
  areaNameFilter?: string; // if set, only show when area name includes this string
}

export const PREP_SECTIONS: PrepSection[] = [
  { id: "floorProtection", labelKey: "prep.sections.floorProtection", items: PREP_FLOOR_PROTECTION },
  { id: "contents", labelKey: "prep.sections.contents", items: PREP_CONTENTS },
  { id: "containment", labelKey: "prep.sections.containment", items: PREP_CONTAINMENT },
  // Appliances are rendered dynamically based on area type — see getAppliancesForArea()
  { id: "fixtures", labelKey: "prep.sections.fixtures", items: PREP_FIXTURES },
];

export const ALL_PREP_ITEMS: Record<string, DemoItemDef> = [
  ...PREP_FLOOR_PROTECTION,
  ...PREP_CONTENTS,
  ...PREP_CONTAINMENT,
  ...PREP_APPLIANCES,
  ...PREP_FIXTURES,
].reduce((acc, item) => ({ ...acc, [item.code]: item }), {} as Record<string, DemoItemDef>);

/** Pre-loading rules: area name (lowercase contains) → prep codes to pre-select */
export const PREP_PRELOADS: Record<string, string[]> = {
  "laundry": ["PREP-WASHER-DR", "PREP-DRYER-DR", "PREP-FLOOR-PLASTIC"],
  "kitchen": ["PREP-FRIDGE-DR", "PREP-DW-DR", "PREP-FLOOR-PLASTIC"],
  "bathroom": ["PREP-FLOOR-PLASTIC", "PREP-CONTENT-MANIP"],
  "default": ["PREP-FLOOR-PLASTIC"], // bedroom, living room, hallway, etc.
};

export function getPreloadCodesForArea(areaName: string): string[] {
  const lower = areaName.toLowerCase();
  for (const [key, codes] of Object.entries(PREP_PRELOADS)) {
    if (key !== "default" && lower.includes(key)) return codes;
  }
  return PREP_PRELOADS["default"] ?? [];
}

// Re-export DemoSection type for convenience
export type { DemoSection };
