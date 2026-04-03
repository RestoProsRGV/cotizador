/**
 * Demo pre-loading rules by area type.
 * Pre-loaded items appear as selected (with "Suggested" badge) on first visit.
 * suggestedOnly items are NOT auto-selected — they appear as suggestion banners.
 */
export const DEMO_PRELOADS: Record<string, { preload: string[]; suggested: string[] }> = {
  "bathroom": {
    preload: ["DEM-DW-RM", "DEM-BSBD-RM", "DEM-VAN-RM", "DEM-SINK-DR", "DEM-FAUC-DR", "DEM-MIRROR-RM"],
    suggested: [],
  },
  "kitchen": {
    preload: ["DEM-DW-RM", "DEM-BSBD-RM", "DEM-BC-RM", "DEM-UC-RM", "DEM-CTOP-RM", "DEM-SINK-DR", "DEM-FAUC-DR"],
    suggested: [],
  },
  "laundry": {
    preload: ["DEM-DW-RM", "DEM-BSBD-RM"],
    suggested: [],
  },
  "bedroom": {
    preload: ["DEM-DW-RM", "DEM-BSBD-RM"],
    suggested: ["DEM-CARP-RM", "DEM-CARP-PAD-RM"],
  },
  "living room": {
    preload: ["DEM-DW-RM", "DEM-BSBD-RM"],
    suggested: ["DEM-CARP-RM"],
  },
  "hallway": {
    preload: ["DEM-DW-RM", "DEM-BSBD-RM"],
    suggested: [],
  },
  "closet": {
    preload: ["DEM-DW-RM", "DEM-BSBD-RM"],
    suggested: [],
  },
  "garage": {
    preload: ["DEM-DW-RM", "DEM-BSBD-RM"],
    suggested: ["DEM-SUBFLR-RM"],
  },
};

export function getDemoPreloads(areaName: string): { preload: string[]; suggested: string[] } {
  const lower = areaName.toLowerCase();
  for (const [key, val] of Object.entries(DEMO_PRELOADS)) {
    if (lower.includes(key)) return val;
  }
  return { preload: [], suggested: [] };
}
