import { describe, it, expect } from "vitest";
import {
  calcAirMovers,
  calcDehumidifiers,
  calcAirScrubbers,
  calcEquipmentForChamber,
  sumEquipment,
} from "./equipment";

describe("calcAirMovers", () => {
  it("returns 0 for 0 SF", () => {
    expect(calcAirMovers(0)).toBe(0);
  });

  it("enforces minimum of 2 for any positive area", () => {
    expect(calcAirMovers(10)).toBe(2);
    expect(calcAirMovers(49)).toBe(2);
  });

  it("returns 2 for exactly 50 SF", () => {
    expect(calcAirMovers(50)).toBe(2);
  });

  it("returns 2 for 100 SF (ceil(100/50) = 2, same as min)", () => {
    expect(calcAirMovers(100)).toBe(2);
  });

  it("returns 3 for 101 SF", () => {
    expect(calcAirMovers(101)).toBe(3);
  });

  it("returns 4 for 200 SF", () => {
    expect(calcAirMovers(200)).toBe(4);
  });

  it("returns 10 for 500 SF", () => {
    expect(calcAirMovers(500)).toBe(10);
  });

  it("rounds up for partial groups", () => {
    expect(calcAirMovers(251)).toBe(6);  // ceil(251/50) = 6
  });
});

describe("calcDehumidifiers", () => {
  it("returns 0 for zero volume", () => {
    expect(calcDehumidifiers({ length: 0, width: 10, height: 8 })).toBe(0);
  });

  it("enforces minimum of 1 for small volumes", () => {
    // 5*5*4 = 100 CF → ceil(100/100) = 1, exactly at minimum
    expect(calcDehumidifiers({ length: 5, width: 5, height: 4 })).toBe(1);
    // 3*3*4 = 36 CF → ceil(36/100) = 1 (minimum)
    expect(calcDehumidifiers({ length: 3, width: 3, height: 4 })).toBe(1);
    // 5*5*8 = 200 CF → ceil(200/100) = 2 (above minimum)
    expect(calcDehumidifiers({ length: 5, width: 5, height: 8 })).toBe(2);
  });

  it("calculates correctly for standard bathroom (10x8x9)", () => {
    // 10*8*9 = 720 CF → ceil(720/100) = 8
    expect(calcDehumidifiers({ length: 10, width: 8, height: 9 })).toBe(8);
  });

  it("calculates correctly for small room (10x10x8)", () => {
    // 10*10*8 = 800 CF → ceil(800/100) = 8
    expect(calcDehumidifiers({ length: 10, width: 10, height: 8 })).toBe(8);
  });

  it("rounds up for partial hundreds", () => {
    // 10*10*9 = 900 CF → ceil(900/100) = 9
    expect(calcDehumidifiers({ length: 10, width: 10, height: 9 })).toBe(9);
    // 11*10*9 = 990 CF → ceil(990/100) = 10
    expect(calcDehumidifiers({ length: 11, width: 10, height: 9 })).toBe(10);
    // 12*10*9 = 1080 CF → ceil(1080/100) = 11
    expect(calcDehumidifiers({ length: 12, width: 10, height: 9 })).toBe(11);
  });
});

describe("calcAirScrubbers", () => {
  it("returns 0 for 0 SF", () => {
    expect(calcAirScrubbers(0)).toBe(0);
  });

  it("enforces minimum of 1 for any positive area", () => {
    expect(calcAirScrubbers(50)).toBe(1);
    expect(calcAirScrubbers(299)).toBe(1);
  });

  it("returns 1 for exactly 300 SF", () => {
    expect(calcAirScrubbers(300)).toBe(1);
  });

  it("returns 2 for 301 SF", () => {
    expect(calcAirScrubbers(301)).toBe(2);
  });

  it("returns 3 for 600 SF", () => {
    expect(calcAirScrubbers(600)).toBe(2);
  });

  it("rounds up correctly", () => {
    expect(calcAirScrubbers(900)).toBe(3);
    expect(calcAirScrubbers(901)).toBe(4);
  });
});

describe("calcEquipmentForChamber", () => {
  const dims = { affectedSf: 200, length: 20, width: 10, height: 9 };

  it("returns 0 air scrubbers when needsAirScrubber is false", () => {
    const result = calcEquipmentForChamber(dims, false);
    expect(result.airScrubbers).toBe(0);
  });

  it("returns air scrubbers when needsAirScrubber is true", () => {
    const result = calcEquipmentForChamber(dims, true);
    expect(result.airScrubbers).toBe(1);  // ceil(200/300) = 1
  });

  it("calculates all values for a typical bathroom", () => {
    const result = calcEquipmentForChamber(dims, true);
    expect(result.airMovers).toBe(4);         // ceil(200/50) = 4
    expect(result.dehumidifiers).toBe(18);    // ceil(20*10*9/100) = ceil(1800/100) = 18
    expect(result.airScrubbers).toBe(1);
  });
});

describe("sumEquipment", () => {
  it("sums across multiple chambers", () => {
    const chambers = [
      { airMovers: 4, dehumidifiers: 2, airScrubbers: 1 },
      { airMovers: 3, dehumidifiers: 1, airScrubbers: 0 },
      { airMovers: 6, dehumidifiers: 3, airScrubbers: 2 },
    ];
    expect(sumEquipment(chambers)).toEqual({
      airMovers: 13,
      dehumidifiers: 6,
      airScrubbers: 3,
    });
  });

  it("returns zeros for empty array", () => {
    expect(sumEquipment([])).toEqual({ airMovers: 0, dehumidifiers: 0, airScrubbers: 0 });
  });
});
