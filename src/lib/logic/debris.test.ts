import { describe, it, expect } from "vitest";
import {
  calcDebrisVolume,
  calcLoads,
  generateDebrisItems,
  DEBRIS_DENSITY_CY_PER_SF,
} from "./debris";

describe("DEBRIS_DENSITY_CY_PER_SF", () => {
  it("has positive density for all materials", () => {
    Object.values(DEBRIS_DENSITY_CY_PER_SF).forEach((d) => {
      expect(d).toBeGreaterThan(0);
    });
  });

  it("has entries for all standard materials", () => {
    const expected = ["drywall", "insulation", "hardwood", "carpet", "tile", "subfloor"];
    expected.forEach((m) => expect(DEBRIS_DENSITY_CY_PER_SF).toHaveProperty(m));
  });
});

describe("calcDebrisVolume", () => {
  it("returns 0 for empty scope", () => {
    expect(calcDebrisVolume([])).toBe(0);
  });

  it("calculates correctly for single material", () => {
    // 100 SF drywall × 0.006 CY/SF = 0.6 CY
    expect(calcDebrisVolume([{ material: "drywall", quantitySf: 100 }])).toBeCloseTo(0.6);
  });

  it("calculates correctly for multiple materials", () => {
    const scope = [
      { material: "drywall", quantitySf: 100 },  // 0.60 CY
      { material: "carpet", quantitySf: 200 },    // 0.60 CY
    ];
    expect(calcDebrisVolume(scope)).toBeCloseTo(1.2);
  });

  it("uses 0.005 default density for unknown material", () => {
    expect(calcDebrisVolume([{ material: "unknown-material", quantitySf: 100 }])).toBeCloseTo(0.5);
  });

  it("handles insulation (highest density)", () => {
    // 100 SF × 0.010 = 1.0 CY
    expect(calcDebrisVolume([{ material: "insulation", quantitySf: 100 }])).toBeCloseTo(1.0);
  });

  it("is additive across multiple items", () => {
    const a = calcDebrisVolume([{ material: "drywall", quantitySf: 50 }]);
    const b = calcDebrisVolume([{ material: "drywall", quantitySf: 50 }]);
    const ab = calcDebrisVolume([{ material: "drywall", quantitySf: 100 }]);
    expect(a + b).toBeCloseTo(ab);
  });
});

describe("calcLoads", () => {
  it("returns 0 for zero volume", () => {
    expect(calcLoads(0)).toBe(0);
  });

  it("returns 0 for negative volume", () => {
    expect(calcLoads(-1)).toBe(0);
  });

  it("enforces minimum of 1 for any positive volume", () => {
    expect(calcLoads(0.1)).toBe(1);
    expect(calcLoads(1)).toBe(1);
    expect(calcLoads(9.99)).toBe(1);
  });

  it("returns 1 for exactly 10 CY", () => {
    expect(calcLoads(10)).toBe(1);
  });

  it("returns 2 for 10.1 CY", () => {
    expect(calcLoads(10.1)).toBe(2);
  });

  it("returns 3 for 25 CY", () => {
    expect(calcLoads(25)).toBe(3);
  });

  it("rounds up correctly", () => {
    expect(calcLoads(21)).toBe(3);
    expect(calcLoads(30)).toBe(3);
    expect(calcLoads(31)).toBe(4);
  });
});

describe("generateDebrisItems", () => {
  it("returns empty array for empty demo scope", () => {
    expect(generateDebrisItems([])).toEqual([]);
  });

  it("returns haul and disposal items", () => {
    const scope = [{ material: "drywall", quantitySf: 500 }];
    const items = generateDebrisItems(scope);
    const codes = items.map((i) => i.xactimateCode);
    expect(codes).toContain("DEB-HAUL");
    expect(codes).toContain("DEB-DISP");
  });

  it("returns exactly 2 items when there is demo", () => {
    const scope = [{ material: "drywall", quantitySf: 100 }];
    expect(generateDebrisItems(scope)).toHaveLength(2);
  });

  it("both items have same load quantity", () => {
    const scope = [{ material: "tile", quantitySf: 200 }];
    const items = generateDebrisItems(scope);
    expect(items[0]!.quantity).toBe(items[1]!.quantity);
  });

  it("all items have module DEB", () => {
    const scope = [{ material: "carpet", quantitySf: 300 }];
    generateDebrisItems(scope).forEach((i) => expect(i.module).toBe("DEB"));
  });
});
