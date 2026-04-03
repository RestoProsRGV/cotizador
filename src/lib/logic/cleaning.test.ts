import { describe, it, expect } from "vitest";
import {
  generateCleaningItems,
  requiresContainment,
  requiresNegativePressure,
} from "./cleaning";

describe("generateCleaningItems — cat1 no demo", () => {
  it("returns empty array", () => {
    expect(generateCleaningItems("cat1", 200, false)).toEqual([]);
  });
});

describe("generateCleaningItems — cat1 with demo", () => {
  it("returns HEPA and antimicrobial only", () => {
    const items = generateCleaningItems("cat1", 200, true);
    const codes = items.map((i) => i.xactimateCode);
    expect(codes).toEqual(["CLN-HEPA", "CLN-ANTIM"]);
  });

  it("uses affectedSf as quantity", () => {
    const items = generateCleaningItems("cat1", 350, true);
    items.forEach((i) => expect(i.quantity).toBe(350));
  });
});

describe("generateCleaningItems — cat2", () => {
  it("returns HEPA, antimicrobial, and disinfectant", () => {
    const items = generateCleaningItems("cat2", 400, false);
    const codes = items.map((i) => i.xactimateCode);
    expect(codes).toEqual(["CLN-HEPA", "CLN-ANTIM", "CLN-DISINF"]);
  });

  it("all items have module CLN", () => {
    const items = generateCleaningItems("cat2", 400, false);
    items.forEach((i) => expect(i.module).toBe("CLN"));
  });
});

describe("generateCleaningItems — cat3", () => {
  it("returns HEPA, antimicrobial, disinfectant, full-room, and odor control", () => {
    const items = generateCleaningItems("cat3", 500, true);
    const codes = items.map((i) => i.xactimateCode);
    expect(codes).toContain("CLN-HEPA");
    expect(codes).toContain("CLN-ANTIM");
    expect(codes).toContain("CLN-DISINF");
    expect(codes).toContain("CLN-FULL-RM");
    expect(codes).toContain("WTR-ODOR");
  });

  it("returns 5 items", () => {
    expect(generateCleaningItems("cat3", 500, true)).toHaveLength(5);
  });
});

describe("generateCleaningItems — mold", () => {
  it("returns HEPA, antimicrobial, and clearance test", () => {
    const items = generateCleaningItems("mold", 300, true);
    const codes = items.map((i) => i.xactimateCode);
    expect(codes).toEqual(["CLN-HEPA", "CLN-ANTIM", "WTR-CLRC-TEST"]);
  });

  it("clearance test quantity is 1 (not area-based)", () => {
    const items = generateCleaningItems("mold", 300, true);
    const test = items.find((i) => i.xactimateCode === "WTR-CLRC-TEST")!;
    expect(test.quantity).toBe(1);
    expect(test.unit).toBe("EA");
  });
});

describe("requiresContainment", () => {
  it("is false for cat1", () => expect(requiresContainment("cat1")).toBe(false));
  it("is true for cat2", () => expect(requiresContainment("cat2")).toBe(true));
  it("is true for cat3", () => expect(requiresContainment("cat3")).toBe(true));
  it("is true for mold", () => expect(requiresContainment("mold")).toBe(true));
});

describe("requiresNegativePressure", () => {
  it("is false for cat1", () => expect(requiresNegativePressure("cat1")).toBe(false));
  it("is false for cat2", () => expect(requiresNegativePressure("cat2")).toBe(false));
  it("is true for cat3", () => expect(requiresNegativePressure("cat3")).toBe(true));
  it("is true for mold", () => expect(requiresNegativePressure("mold")).toBe(true));
});
