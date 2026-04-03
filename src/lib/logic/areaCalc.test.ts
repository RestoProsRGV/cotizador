/**
 * Tests for area SF / perimeter calculations.
 * These are pure functions used in Areas and Equipment screens.
 */
import { describe, it, expect } from "vitest";

// Pure functions extracted from UI logic — test the math
function calcSF(length: number, width: number): number {
  return Math.round(length * width * 100) / 100;
}

function calcPerimeter(length: number, width: number): number {
  return Math.round(2 * (length + width) * 100) / 100;
}

function calcVolumeCF(length: number, width: number, height: number): number {
  return Math.round(length * width * height * 100) / 100;
}

function totalSF(areas: { length: number; width: number }[]): number {
  return areas.reduce((sum, a) => sum + calcSF(a.length, a.width), 0);
}

describe("calcSF — square footage from dimensions", () => {
  it("calculates correctly for a square room", () => {
    expect(calcSF(10, 10)).toBe(100);
  });

  it("calculates correctly for a rectangle", () => {
    expect(calcSF(15, 12)).toBe(180);
  });

  it("returns 0 for zero dimensions", () => {
    expect(calcSF(0, 10)).toBe(0);
    expect(calcSF(10, 0)).toBe(0);
  });

  it("rounds to 2 decimal places", () => {
    // 3 * 3.333 = 9.999 → Math.round(9.999 * 100)/100 = Math.round(999.9)/100 = 1000/100 = 10
    expect(calcSF(3, 3.333)).toBe(10);
    expect(calcSF(3.14, 2.71)).toBeCloseTo(8.51, 2);
  });

  it("handles fractional feet (e.g. 10.5 × 8.5)", () => {
    expect(calcSF(10.5, 8.5)).toBe(89.25);
  });

  it("is commutative (L×W = W×L)", () => {
    expect(calcSF(15, 12)).toBe(calcSF(12, 15));
  });
});

describe("calcPerimeter — for LF-based items like baseboards", () => {
  it("calculates correctly for square room", () => {
    // 2*(10+10) = 40 LF
    expect(calcPerimeter(10, 10)).toBe(40);
  });

  it("calculates correctly for rectangle", () => {
    // 2*(15+12) = 54 LF
    expect(calcPerimeter(15, 12)).toBe(54);
  });

  it("returns 0 for zero dimensions", () => {
    expect(calcPerimeter(0, 0)).toBe(0);
  });

  it("is symmetric", () => {
    expect(calcPerimeter(15, 12)).toBe(calcPerimeter(12, 15));
  });

  it("handles fractional feet", () => {
    // 2*(10.5+8.5) = 38.0
    expect(calcPerimeter(10.5, 8.5)).toBe(38);
  });
});

describe("calcVolumeCF — cubic feet for dehumidifier calc", () => {
  it("calculates correctly", () => {
    // 10*10*9 = 900
    expect(calcVolumeCF(10, 10, 9)).toBe(900);
  });

  it("returns 0 for zero height", () => {
    expect(calcVolumeCF(10, 10, 0)).toBe(0);
  });

  it("handles standard ceiling heights", () => {
    expect(calcVolumeCF(12, 10, 8)).toBe(960);
    expect(calcVolumeCF(12, 10, 9)).toBe(1080);
    expect(calcVolumeCF(12, 10, 10)).toBe(1200);
  });
});

describe("totalSF — summing areas", () => {
  it("returns 0 for empty array", () => {
    expect(totalSF([])).toBe(0);
  });

  it("sums SF of all areas", () => {
    const areas = [
      { length: 10, width: 10 },  // 100 SF
      { length: 15, width: 8 },   // 120 SF
      { length: 5, width: 6 },    // 30 SF
    ];
    expect(totalSF(areas)).toBe(250);
  });

  it("handles single area", () => {
    expect(totalSF([{ length: 20, width: 15 }])).toBe(300);
  });

  it("is consistent with multiple calcSF calls", () => {
    const areas = [
      { length: 12, width: 10 },
      { length: 8, width: 6 },
    ];
    const expected = calcSF(12, 10) + calcSF(8, 6);
    expect(totalSF(areas)).toBe(expected);
  });
});

describe("equipment quantity cross-validation", () => {
  // Verify that SF-based equipment formulas give consistent results
  it("air movers scale linearly with SF", () => {
    const calcAirMovers = (sf: number) => Math.max(2, Math.ceil(sf / 50));
    expect(calcAirMovers(calcSF(10, 10))).toBe(2);  // 100 SF → 2
    expect(calcAirMovers(calcSF(20, 15))).toBe(6);  // 300 SF → 6
    expect(calcAirMovers(calcSF(30, 20))).toBe(12); // 600 SF → 12
  });

  it("dehumidifiers scale with volume", () => {
    const calcDehus = (l: number, w: number, h: number) =>
      Math.max(1, Math.ceil(calcVolumeCF(l, w, h) / 100));
    expect(calcDehus(10, 10, 9)).toBe(9);  // 900 CF → 9
    expect(calcDehus(12, 10, 8)).toBe(10); // 960 CF → 10
  });
});
