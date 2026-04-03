/**
 * Extended tests for general.ts — supervision fee tiers, edge cases.
 */
import { describe, it, expect } from "vitest";
import {
  classifyJobSize,
  isEmergencyCall,
  generateGeneralItems,
  SUPERVISION_FEE,
  EMERGENCY_FEE,
} from "./general";

describe("classifyJobSize — boundary values", () => {
  it("499 SF = small", () => expect(classifyJobSize(499)).toBe("small"));
  it("500 SF = medium", () => expect(classifyJobSize(500)).toBe("medium"));
  it("1500 SF = medium", () => expect(classifyJobSize(1500)).toBe("medium"));
  it("1501 SF = large", () => expect(classifyJobSize(1501)).toBe("large"));
  it("0 SF = small", () => expect(classifyJobSize(0)).toBe("small"));
  it("10000 SF = large", () => expect(classifyJobSize(10000)).toBe("large"));
});

describe("SUPERVISION_FEE — correct amounts", () => {
  it("small is $150", () => expect(SUPERVISION_FEE.small).toBe(150));
  it("medium is $250", () => expect(SUPERVISION_FEE.medium).toBe(250));
  it("large is $400", () => expect(SUPERVISION_FEE.large).toBe(400));
  it("fees are ascending", () => {
    expect(SUPERVISION_FEE.small).toBeLessThan(SUPERVISION_FEE.medium);
    expect(SUPERVISION_FEE.medium).toBeLessThan(SUPERVISION_FEE.large);
  });
});

describe("EMERGENCY_FEE", () => {
  it("is $250", () => expect(EMERGENCY_FEE).toBe(250));
  it("is a positive integer", () => {
    expect(EMERGENCY_FEE).toBeGreaterThan(0);
    expect(Number.isInteger(EMERGENCY_FEE)).toBe(true);
  });
});

describe("isEmergencyCall — weekday boundary times", () => {
  // All tests use local Date objects — day/hour based on local time
  it("8:00am Monday = not emergency (on the boundary)", () => {
    const d = new Date("2026-04-06T08:00:00");
    expect(isEmergencyCall(d)).toBe(false);
  });

  it("7:59am Monday = emergency (just before)", () => {
    const d = new Date("2026-04-06T07:59:00");
    expect(isEmergencyCall(d)).toBe(true);
  });

  it("5:00pm Friday = emergency (at boundary)", () => {
    const d = new Date("2026-04-10T17:00:00");
    expect(isEmergencyCall(d)).toBe(true);
  });

  it("4:59pm Friday = not emergency (just before)", () => {
    const d = new Date("2026-04-10T16:59:00");
    expect(isEmergencyCall(d)).toBe(false);
  });

  it("midnight weekday = emergency", () => {
    const d = new Date("2026-04-07T00:00:00"); // Tuesday midnight
    expect(isEmergencyCall(d)).toBe(true);
  });

  it("noon weekday = not emergency", () => {
    const d = new Date("2026-04-07T12:00:00"); // Tuesday noon
    expect(isEmergencyCall(d)).toBe(false);
  });
});

describe("isEmergencyCall — all days of week", () => {
  it("Sunday 10am = emergency", () => {
    expect(isEmergencyCall(new Date("2026-04-05T10:00:00"))).toBe(true);
  });
  it("Monday 10am = not emergency", () => {
    expect(isEmergencyCall(new Date("2026-04-06T10:00:00"))).toBe(false);
  });
  it("Tuesday 10am = not emergency", () => {
    expect(isEmergencyCall(new Date("2026-04-07T10:00:00"))).toBe(false);
  });
  it("Wednesday 10am = not emergency", () => {
    expect(isEmergencyCall(new Date("2026-04-08T10:00:00"))).toBe(false);
  });
  it("Thursday 10am = not emergency", () => {
    expect(isEmergencyCall(new Date("2026-04-09T10:00:00"))).toBe(false);
  });
  it("Friday 10am = not emergency", () => {
    expect(isEmergencyCall(new Date("2026-04-10T10:00:00"))).toBe(false);
  });
  it("Saturday 10am = emergency", () => {
    expect(isEmergencyCall(new Date("2026-04-11T10:00:00"))).toBe(true);
  });
});

describe("generateGeneralItems — item structure", () => {
  it("WTR-EVLTN is always present", () => {
    const items = generateGeneralItems(100, false);
    const codes = items.map((i) => i.xactimateCode);
    expect(codes).toContain("WTR-EVLTN");
  });

  it("GEN-PPE is always present", () => {
    const items = generateGeneralItems(100, false);
    const codes = items.map((i) => i.xactimateCode);
    expect(codes).toContain("GEN-PPE");
  });

  it("GEN-SUPV is always present", () => {
    const items = generateGeneralItems(100, false);
    const codes = items.map((i) => i.xactimateCode);
    expect(codes).toContain("GEN-SUPV");
  });

  it("GEN-EMRG is absent when not emergency", () => {
    const items = generateGeneralItems(300, false);
    const codes = items.map((i) => i.xactimateCode);
    expect(codes).not.toContain("GEN-EMRG");
  });

  it("GEN-EMRG is present when emergency", () => {
    const items = generateGeneralItems(300, true);
    const codes = items.map((i) => i.xactimateCode);
    expect(codes).toContain("GEN-EMRG");
  });

  it("WTR-EVLTN has module WTR (not GEN)", () => {
    const item = generateGeneralItems(100, false).find(
      (i) => i.xactimateCode === "WTR-EVLTN"
    );
    expect(item?.module).toBe("WTR");
  });

  it("GEN-EMRG has module GEN", () => {
    const item = generateGeneralItems(100, true).find(
      (i) => i.xactimateCode === "GEN-EMRG"
    );
    expect(item?.module).toBe("GEN");
  });

  it("all item quantities are positive integers or 1", () => {
    const items = generateGeneralItems(500, true);
    items.forEach((item) => {
      expect(item.quantity).toBeGreaterThan(0);
    });
  });

  it("supervision name includes job size for small", () => {
    const item = generateGeneralItems(100, false).find(
      (i) => i.xactimateCode === "GEN-SUPV"
    );
    expect(item?.name).toMatch(/small/i);
    expect(item?.name).toMatch(/\$150/);
  });

  it("supervision name includes job size for medium", () => {
    const item = generateGeneralItems(800, false).find(
      (i) => i.xactimateCode === "GEN-SUPV"
    );
    expect(item?.name).toMatch(/medium/i);
    expect(item?.name).toMatch(/\$250/);
  });

  it("supervision name includes job size for large", () => {
    const item = generateGeneralItems(2000, false).find(
      (i) => i.xactimateCode === "GEN-SUPV"
    );
    expect(item?.name).toMatch(/large/i);
    expect(item?.name).toMatch(/\$400/);
  });
});
