export interface DemoItemDef {
  code: string;
  name: string;
  unit: string;
  suggestions: string[];
}

export interface DemoSection {
  id: string;
  labelKey: string;
  items: DemoItemDef[];
}

export const WALLS_STRUCTURE: DemoItemDef[] = [
  { code: "DEM-DW-RM", name: "Drywall Removal", unit: "SF", suggestions: ["DEM-BSBD-RM", "DEM-INSUL-RM"] },
  { code: "DEM-FLOOD-CUT", name: "Flood Cut", unit: "LF", suggestions: ["DEM-BSBD-RM", "DEM-INSUL-RM", "DEM-CAVITY-DRILL"] },
  { code: "DEM-CAVITY-DRILL", name: "Wall Cavity Drill", unit: "EA", suggestions: [] },
  { code: "DEM-INSUL-RM", name: "Insulation Removal", unit: "SF", suggestions: [] },
];

export const TRIM_FINISHES: DemoItemDef[] = [
  { code: "DEM-BSBD-RM", name: "Baseboard Removal", unit: "LF", suggestions: [] },
  { code: "DEM-DOOR-CASE-RM", name: "Door Casing Removal", unit: "LF", suggestions: [] },
  { code: "DEM-THRESH-RM", name: "Threshold Removal", unit: "EA", suggestions: [] },
];

export const FLOORING: DemoItemDef[] = [
  { code: "DEM-CARP-RM", name: "Carpet Removal", unit: "SF", suggestions: ["DEM-CARP-PAD-RM"] },
  { code: "DEM-CARP-PAD-RM", name: "Carpet Pad Removal", unit: "SF", suggestions: [] },
  { code: "DEM-HW-RM", name: "Hardwood Removal", unit: "SF", suggestions: [] },
  { code: "DEM-TILE-RM", name: "Tile Removal", unit: "SF", suggestions: [] },
  { code: "DEM-LAM-RM", name: "Laminate Removal", unit: "SF", suggestions: [] },
  { code: "DEM-VNL-RM", name: "Vinyl/LVP Removal", unit: "SF", suggestions: [] },
  { code: "DEM-SUBFLR-RM", name: "Subfloor Removal", unit: "SF", suggestions: [] },
];

export const CABINETS: DemoItemDef[] = [
  { code: "DEM-BC-RM", name: "Base Cabinet Removal", unit: "LF", suggestions: ["DEM-CTOP-RM"] },
  { code: "DEM-UC-RM", name: "Upper Cabinet Removal", unit: "LF", suggestions: [] },
  { code: "DEM-VAN-RM", name: "Vanity Removal", unit: "EA", suggestions: ["DEM-SINK-DR", "DEM-FAUC-DR", "DEM-MIRROR-RM"] },
  { code: "DEM-CTOP-RM", name: "Countertop Removal", unit: "LF", suggestions: [] },
];

export const PLUMBING: DemoItemDef[] = [
  { code: "DEM-TOILET-DR", name: "Toilet Detach & Reset", unit: "EA", suggestions: ["DEM-SINK-DR"] },
  { code: "DEM-SINK-DR", name: "Sink Detach & Reset", unit: "EA", suggestions: [] },
  { code: "DEM-FAUC-DR", name: "Faucet Detach & Reset", unit: "EA", suggestions: [] },
  { code: "DEM-MIRROR-RM", name: "Mirror Removal", unit: "EA", suggestions: [] },
];

export const CEILING: DemoItemDef[] = [
  { code: "DEM-CEIL-DW-RM", name: "Ceiling Drywall Removal", unit: "SF", suggestions: [] },
  { code: "DEM-CEIL-ACT-RM", name: "Acoustic Tile Removal", unit: "SF", suggestions: [] },
  { code: "DEM-CEIL-INSUL-RM", name: "Ceiling Insulation Removal", unit: "SF", suggestions: [] },
];

export const DEMO_SECTIONS: DemoSection[] = [
  { id: "walls", labelKey: "demo.sections.wallsStructure", items: WALLS_STRUCTURE },
  { id: "trim", labelKey: "demo.sections.trimFinishes", items: TRIM_FINISHES },
  { id: "flooring", labelKey: "demo.sections.flooring", items: FLOORING },
  { id: "cabinets", labelKey: "demo.sections.cabinets", items: CABINETS },
  { id: "plumbing", labelKey: "demo.sections.plumbing", items: PLUMBING },
  { id: "ceiling", labelKey: "demo.sections.ceiling", items: CEILING },
];

/** All items as a flat lookup by code */
export const ALL_DEMO_ITEMS: Record<string, DemoItemDef> = [
  ...WALLS_STRUCTURE,
  ...TRIM_FINISHES,
  ...FLOORING,
  ...CABINETS,
  ...PLUMBING,
  ...CEILING,
].reduce(
  (acc, item) => ({ ...acc, [item.code]: item }),
  {} as Record<string, DemoItemDef>
);
