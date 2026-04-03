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

/**
 * Per-area formula validation — matches real-world job scenarios.
 * These tests document expected equipment counts for typical RestoPros jobs.
 */
describe("per-area dehumidifier calculations — real job dimensions", () => {
  it("bathroom 10×8×8ft = 640 CF → 7 dehus", () => {
    // 640 CF ÷ 100 = 6.4 → ceil = 7
    expect(calcDehumidifiers({ length: 10, width: 8, height: 8 })).toBe(7);
  });

  it("bathroom 10×8×9ft = 720 CF → 8 dehus", () => {
    // 720 CF ÷ 100 = 7.2 → ceil = 8
    expect(calcDehumidifiers({ length: 10, width: 8, height: 9 })).toBe(8);
  });

  it("kitchen 12×10×8ft = 960 CF → 10 dehus", () => {
    // 960 CF ÷ 100 = 9.6 → ceil = 10
    expect(calcDehumidifiers({ length: 12, width: 10, height: 8 })).toBe(10);
  });

  it("kitchen 12×10×9ft = 1080 CF → 11 dehus", () => {
    // 1080 CF ÷ 100 = 10.8 → ceil = 11
    expect(calcDehumidifiers({ length: 12, width: 10, height: 9 })).toBe(11);
  });

  it("bathroom(8ft) + kitchen(8ft) summed = 7+10 = 17 total dehus", () => {
    const bath = calcDehumidifiers({ length: 10, width: 8, height: 8 });   // 7
    const kitchen = calcDehumidifiers({ length: 12, width: 10, height: 8 }); // 10
    expect(bath + kitchen).toBe(17);
  });

  it("bathroom(9ft) + kitchen(9ft) summed = 8+11 = 19 total dehus (taller ceilings)", () => {
    const bath = calcDehumidifiers({ length: 10, width: 8, height: 9 });     // 8
    const kitchen = calcDehumidifiers({ length: 12, width: 10, height: 9 }); // 11
    expect(bath + kitchen).toBe(19);
  });
});

describe("air mover calculations — common job sizes", () => {
  it("bathroom 80 SF → 2 air movers (ceil(80/50)=2 meets minimum)", () => {
    expect(calcAirMovers(80)).toBe(2);
  });

  it("kitchen 120 SF → 3 air movers (ceil(120/50)=3)", () => {
    expect(calcAirMovers(120)).toBe(3);
  });

  it("200 SF total job → 4 air movers when applied globally (ceil(200/50)=4)", () => {
    expect(calcAirMovers(200)).toBe(4);
  });

  it("living room 300 SF → 6 air movers", () => {
    expect(calcAirMovers(300)).toBe(6);
  });

  it("per-area sum for bathroom+kitchen = 2+3 = 5 (each area computed separately)", () => {
    const bath = calcAirMovers(80);    // 2
    const kitchen = calcAirMovers(120); // 3
    expect(bath + kitchen).toBe(5);
  });
});

describe("air scrubber calculations — typical Cat 2/3 jobs", () => {
  it("200 SF job → 1 air scrubber (ceil(200/300)=1)", () => {
    expect(calcAirScrubbers(200)).toBe(1);
  });

  it("400 SF job → 2 air scrubbers (ceil(400/300)=2)", () => {
    expect(calcAirScrubbers(400)).toBe(2);
  });
});

describe("sumEquipment — multi-area job totals", () => {
  it("bathroom + kitchen with 8ft ceilings", () => {
    const bath = calcEquipmentForChamber(
      { affectedSf: 80, length: 10, width: 8, height: 8 },
      true
    );
    const kitchen = calcEquipmentForChamber(
      { affectedSf: 120, length: 12, width: 10, height: 8 },
      true
    );
    const total = sumEquipment([bath, kitchen]);
    expect(total.airMovers).toBe(2 + 3);      // 5
    expect(total.dehumidifiers).toBe(7 + 10); // 17
    expect(total.airScrubbers).toBe(1 + 1);   // 2 (one per area at this SF)
  });

  it("default 3-day billing: qty × 3 matches stored line-item quantity", () => {
    const qty = calcDehumidifiers({ length: 10, width: 8, height: 8 }); // 7
    const days = 3;
    expect(qty * days).toBe(21); // 21 day-units stored in line_items.quantity
  });
});
