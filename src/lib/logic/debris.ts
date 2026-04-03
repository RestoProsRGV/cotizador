/**
 * Debris volume and haul-off calculations from demolition scope.
 */

export interface DebrisLineItem {
  module: "DEB";
  xactimateCode: string;
  name: string;
  unit: string;
  quantity: number;
}

/** Cubic yards per dump-truck load */
const CY_PER_LOAD = 10;

/**
 * Estimate debris volume (cubic yards) from demolished materials.
 *
 * Rough industry averages:
 * - Drywall: 0.006 CY per SF (1/2" drywall, crumbled)
 * - Insulation: 0.010 CY per SF (batt insulation, bagged)
 * - Hardwood flooring: 0.004 CY per SF
 * - Carpet + pad: 0.003 CY per SF
 * - Tile: 0.005 CY per SF
 * - Subfloor (OSB/plywood): 0.004 CY per SF
 */
export const DEBRIS_DENSITY_CY_PER_SF: Record<string, number> = {
  drywall: 0.006,
  insulation: 0.010,
  hardwood: 0.004,
  carpet: 0.003,
  tile: 0.005,
  subfloor: 0.004,
};

export interface DemoScope {
  material: string;
  quantitySf: number;
}

/**
 * Calculate total debris volume in cubic yards from a list of demolished materials.
 */
export function calcDebrisVolume(demoScope: DemoScope[]): number {
  return demoScope.reduce((total, item) => {
    const density = DEBRIS_DENSITY_CY_PER_SF[item.material] ?? 0.005;
    return total + item.quantitySf * density;
  }, 0);
}

/**
 * Number of haul-off loads required for a given volume.
 * Minimum 1 load whenever there is any demo.
 */
export function calcLoads(volumeCy: number): number {
  if (volumeCy <= 0) return 0;
  return Math.max(1, Math.ceil(volumeCy / CY_PER_LOAD));
}

/**
 * Generate debris line items (haul + disposal) from demo scope.
 * Returns empty array when there is no demo.
 */
export function generateDebrisItems(demoScope: DemoScope[]): DebrisLineItem[] {
  if (demoScope.length === 0) return [];

  const volumeCy = calcDebrisVolume(demoScope);
  const loads = calcLoads(volumeCy);

  if (loads === 0) return [];

  return [
    {
      module: "DEB",
      xactimateCode: "DEB-HAUL",
      name: "Debris haul-off",
      unit: "load",
      quantity: loads,
    },
    {
      module: "DEB",
      xactimateCode: "DEB-DISP",
      name: "Debris disposal fee",
      unit: "load",
      quantity: loads,
    },
  ];
}
