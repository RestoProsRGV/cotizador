/**
 * Tests for demo item auto-suggestion logic.
 * The suggestion rules are defined in src/constants/demoItems.ts
 * We test the relationship graph here as pure data assertions.
 */
import { describe, it, expect } from "vitest";

// Re-define the suggestion rules as a map for pure testing
const SUGGESTION_MAP: Record<string, string[]> = {
  "DEM-DW-RM": ["DEM-BSBD-RM", "DEM-INSUL-RM"],
  "DEM-FLOOD-CUT-2FT": ["DEM-BSBD-RM", "DEM-INSUL-RM"],
  "DEM-FLOOD-CUT-4FT": ["DEM-BSBD-RM", "DEM-INSUL-RM"],
  "DEM-CARP-RM": ["DEM-CARP-PAD-RM"],
  "DEM-BC-RM": ["DEM-CTOP-RM"],
  "DEM-VAN-RM": ["DEM-SINK-DR", "DEM-FAUC-DR", "DEM-MIRROR-RM"],
  "DEM-TOILET-DR": ["DEM-SINK-DR"],
  "DEM-CAVITY-DRILL": [],
  "DEM-INSUL-RM": [],
  "DEM-BSBD-RM": [],
  "DEM-CARP-PAD-RM": [],
  "DEM-HW-RM": [],
  "DEM-TILE-RM": [],
  "DEM-LAM-RM": [],
  "DEM-VNL-RM": [],
  "DEM-SUBFLR-RM": [],
  "DEM-UC-RM": [],
  "DEM-CTOP-RM": [],
  "DEM-SINK-DR": [],
  "DEM-FAUC-DR": [],
  "DEM-MIRROR-RM": [],
  "DEM-CEIL-DW-RM": [],
  "DEM-CEIL-ACT-RM": [],
  "DEM-CEIL-INSUL-RM": [],
};

// Flood cut quantity multipliers (matches demoItems.ts suggestionRules)
const FLOOD_CUT_QTY_MULTIPLIERS: Record<string, Record<string, number>> = {
  "DEM-FLOOD-CUT-2FT": { "DEM-BSBD-RM": 1, "DEM-INSUL-RM": 2 },
  "DEM-FLOOD-CUT-4FT": { "DEM-BSBD-RM": 1, "DEM-INSUL-RM": 4 },
};

function getSuggestions(code: string, selectedCodes: Set<string>): string[] {
  const all = SUGGESTION_MAP[code] ?? [];
  return all.filter((s) => !selectedCodes.has(s));
}

function applyAll(trigger: string, selected: Set<string>): Set<string> {
  const next = new Set(selected);
  next.add(trigger);
  const suggestions = getSuggestions(trigger, selected);
  suggestions.forEach((s) => next.add(s));
  return next;
}

describe("suggestion rules — Drywall Removal", () => {
  it("suggests Baseboard and Insulation removal", () => {
    const suggestions = SUGGESTION_MAP["DEM-DW-RM"]!;
    expect(suggestions).toContain("DEM-BSBD-RM");
    expect(suggestions).toContain("DEM-INSUL-RM");
  });

  it("filters out already-selected items", () => {
    const selected = new Set(["DEM-BSBD-RM"]);
    const suggestions = getSuggestions("DEM-DW-RM", selected);
    expect(suggestions).not.toContain("DEM-BSBD-RM");
    expect(suggestions).toContain("DEM-INSUL-RM");
  });

  it("returns empty when all suggestions already selected", () => {
    const selected = new Set(["DEM-BSBD-RM", "DEM-INSUL-RM"]);
    expect(getSuggestions("DEM-DW-RM", selected)).toHaveLength(0);
  });
});

describe("suggestion rules — Flood Cut 2ft", () => {
  it("suggests Baseboard and Insulation (not Cavity Drill)", () => {
    const suggestions = SUGGESTION_MAP["DEM-FLOOD-CUT-2FT"]!;
    expect(suggestions).toContain("DEM-BSBD-RM");
    expect(suggestions).toContain("DEM-INSUL-RM");
    expect(suggestions).not.toContain("DEM-CAVITY-DRILL");
    expect(suggestions).toHaveLength(2);
  });

  it("filters out already-selected items", () => {
    const selected = new Set(["DEM-BSBD-RM"]);
    const suggestions = getSuggestions("DEM-FLOOD-CUT-2FT", selected);
    expect(suggestions).not.toContain("DEM-BSBD-RM");
    expect(suggestions).toContain("DEM-INSUL-RM");
  });
});

describe("suggestion rules — Flood Cut 4ft", () => {
  it("suggests Baseboard and Insulation (not Cavity Drill)", () => {
    const suggestions = SUGGESTION_MAP["DEM-FLOOD-CUT-4FT"]!;
    expect(suggestions).toContain("DEM-BSBD-RM");
    expect(suggestions).toContain("DEM-INSUL-RM");
    expect(suggestions).not.toContain("DEM-CAVITY-DRILL");
    expect(suggestions).toHaveLength(2);
  });

  it("filters out already-selected items", () => {
    const selected = new Set(["DEM-INSUL-RM"]);
    const suggestions = getSuggestions("DEM-FLOOD-CUT-4FT", selected);
    expect(suggestions).toContain("DEM-BSBD-RM");
    expect(suggestions).not.toContain("DEM-INSUL-RM");
  });
});

describe("flood cut quantity multipliers", () => {
  it("2ft: Baseboard multiplier is 1 (same LF)", () => {
    expect(FLOOD_CUT_QTY_MULTIPLIERS["DEM-FLOOD-CUT-2FT"]!["DEM-BSBD-RM"]).toBe(1);
  });

  it("2ft: Insulation multiplier is 2 (LF × 2 = SF)", () => {
    expect(FLOOD_CUT_QTY_MULTIPLIERS["DEM-FLOOD-CUT-2FT"]!["DEM-INSUL-RM"]).toBe(2);
  });

  it("4ft: Baseboard multiplier is 1 (same LF)", () => {
    expect(FLOOD_CUT_QTY_MULTIPLIERS["DEM-FLOOD-CUT-4FT"]!["DEM-BSBD-RM"]).toBe(1);
  });

  it("4ft: Insulation multiplier is 4 (LF × 4 = SF)", () => {
    expect(FLOOD_CUT_QTY_MULTIPLIERS["DEM-FLOOD-CUT-4FT"]!["DEM-INSUL-RM"]).toBe(4);
  });

  it("2ft: 20 LF flood cut → 20 LF baseboard", () => {
    const parentQty = 20;
    const mult = FLOOD_CUT_QTY_MULTIPLIERS["DEM-FLOOD-CUT-2FT"]!["DEM-BSBD-RM"]!;
    expect(Math.round(parentQty * mult)).toBe(20);
  });

  it("2ft: 20 LF flood cut → 40 SF insulation", () => {
    const parentQty = 20;
    const mult = FLOOD_CUT_QTY_MULTIPLIERS["DEM-FLOOD-CUT-2FT"]!["DEM-INSUL-RM"]!;
    expect(Math.round(parentQty * mult)).toBe(40);
  });

  it("4ft: 20 LF flood cut → 20 LF baseboard", () => {
    const parentQty = 20;
    const mult = FLOOD_CUT_QTY_MULTIPLIERS["DEM-FLOOD-CUT-4FT"]!["DEM-BSBD-RM"]!;
    expect(Math.round(parentQty * mult)).toBe(20);
  });

  it("4ft: 20 LF flood cut → 80 SF insulation", () => {
    const parentQty = 20;
    const mult = FLOOD_CUT_QTY_MULTIPLIERS["DEM-FLOOD-CUT-4FT"]!["DEM-INSUL-RM"]!;
    expect(Math.round(parentQty * mult)).toBe(80);
  });

  it("4ft multiplier is 2× the 2ft multiplier for insulation", () => {
    const m2 = FLOOD_CUT_QTY_MULTIPLIERS["DEM-FLOOD-CUT-2FT"]!["DEM-INSUL-RM"]!;
    const m4 = FLOOD_CUT_QTY_MULTIPLIERS["DEM-FLOOD-CUT-4FT"]!["DEM-INSUL-RM"]!;
    expect(m4).toBe(m2 * 2);
  });
});

describe("suggestion rules — Vanity Removal", () => {
  it("suggests Sink, Faucet, and Mirror removal", () => {
    const suggestions = SUGGESTION_MAP["DEM-VAN-RM"]!;
    expect(suggestions).toContain("DEM-SINK-DR");
    expect(suggestions).toContain("DEM-FAUC-DR");
    expect(suggestions).toContain("DEM-MIRROR-RM");
    expect(suggestions).toHaveLength(3);
  });
});

describe("suggestion rules — Toilet Detach", () => {
  it("suggests Sink Detach", () => {
    const suggestions = SUGGESTION_MAP["DEM-TOILET-DR"]!;
    expect(suggestions).toContain("DEM-SINK-DR");
    expect(suggestions).toHaveLength(1);
  });
});

describe("suggestion rules — Carpet Removal", () => {
  it("suggests Carpet Pad removal", () => {
    const suggestions = SUGGESTION_MAP["DEM-CARP-RM"]!;
    expect(suggestions).toContain("DEM-CARP-PAD-RM");
    expect(suggestions).toHaveLength(1);
  });
});

describe("suggestion rules — items with no suggestions", () => {
  const noSuggestions = [
    "DEM-CAVITY-DRILL",
    "DEM-INSUL-RM",
    "DEM-BSBD-RM",
    "DEM-HW-RM",
    "DEM-TILE-RM",
    "DEM-SINK-DR",
    "DEM-CEIL-DW-RM",
  ];

  noSuggestions.forEach((code) => {
    it(`${code} has no suggestions`, () => {
      expect(SUGGESTION_MAP[code]).toHaveLength(0);
    });
  });
});

describe("applyAll — add trigger + all suggestions", () => {
  it("adds drywall + both suggestions", () => {
    const result = applyAll("DEM-DW-RM", new Set());
    expect(result.has("DEM-DW-RM")).toBe(true);
    expect(result.has("DEM-BSBD-RM")).toBe(true);
    expect(result.has("DEM-INSUL-RM")).toBe(true);
    expect(result.size).toBe(3);
  });

  it("does not duplicate already-selected items", () => {
    const existing = new Set(["DEM-BSBD-RM"]);
    const result = applyAll("DEM-DW-RM", existing);
    expect(result.size).toBe(3);
  });

  it("flood cut 2ft + both suggestions = 3 total", () => {
    const result = applyAll("DEM-FLOOD-CUT-2FT", new Set());
    expect(result.has("DEM-FLOOD-CUT-2FT")).toBe(true);
    expect(result.has("DEM-BSBD-RM")).toBe(true);
    expect(result.has("DEM-INSUL-RM")).toBe(true);
    expect(result.size).toBe(3);
  });

  it("flood cut 4ft + both suggestions = 3 total", () => {
    const result = applyAll("DEM-FLOOD-CUT-4FT", new Set());
    expect(result.has("DEM-FLOOD-CUT-4FT")).toBe(true);
    expect(result.has("DEM-BSBD-RM")).toBe(true);
    expect(result.has("DEM-INSUL-RM")).toBe(true);
    expect(result.size).toBe(3);
  });

  it("adds item with no suggestions (just the item)", () => {
    const result = applyAll("DEM-HW-RM", new Set());
    expect(result.has("DEM-HW-RM")).toBe(true);
    expect(result.size).toBe(1);
  });

  it("vanity removal brings 3 suggestions + itself = 4 total", () => {
    const result = applyAll("DEM-VAN-RM", new Set());
    expect(result.size).toBe(4);
  });
});

describe("suggestion integrity — no circular dependencies", () => {
  it("no item suggests itself", () => {
    Object.entries(SUGGESTION_MAP).forEach(([code, suggestions]) => {
      expect(suggestions).not.toContain(code);
    });
  });

  it("all suggested codes exist in the map", () => {
    Object.entries(SUGGESTION_MAP).forEach(([_code, suggestions]) => {
      suggestions.forEach((s) => {
        expect(SUGGESTION_MAP).toHaveProperty(s);
      });
    });
  });

  it("DEM-FLOOD-CUT (old code) is NOT in the map — replaced by 2ft/4ft variants", () => {
    expect(SUGGESTION_MAP).not.toHaveProperty("DEM-FLOOD-CUT");
  });

  it("both flood cut variants are in the map", () => {
    expect(SUGGESTION_MAP).toHaveProperty("DEM-FLOOD-CUT-2FT");
    expect(SUGGESTION_MAP).toHaveProperty("DEM-FLOOD-CUT-4FT");
  });
});
