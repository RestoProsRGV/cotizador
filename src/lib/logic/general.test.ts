import { describe, it, expect } from "vitest";
import {
  classifyJobSize,
  isEmergencyCall,
  generateGeneralItems,
  SUPERVISION_FEE,
  EMERGENCY_FEE,
} from "./general";

describe("classifyJobSize", () => {
  it("small for < 500 SF", () => {
    expect(classifyJobSize(0)).toBe("small");
    expect(classifyJobSize(200)).toBe("small");
    expect(classifyJobSize(499)).toBe("small");
  });

  it("medium for 500–1500 SF inclusive", () => {
    expect(classifyJobSize(500)).toBe("medium");
    expect(classifyJobSize(1000)).toBe("medium");
    expect(classifyJobSize(1500)).toBe("medium");
  });

  it("large for > 1500 SF", () => {
    expect(classifyJobSize(1501)).toBe("large");
    expect(classifyJobSize(5000)).toBe("large");
  });
});

describe("SUPERVISION_FEE values", () => {
  it("small = $150", () => expect(SUPERVISION_FEE.small).toBe(150));
  it("medium = $250", () => expect(SUPERVISION_FEE.medium).toBe(250));
  it("large = $400", () => expect(SUPERVISION_FEE.large).toBe(400));
});

describe("EMERGENCY_FEE", () => {
  it("is $250", () => expect(EMERGENCY_FEE).toBe(250));
});

describe("isEmergencyCall", () => {
  // Monday 9am CST — normal business hours
  it("returns false for Monday 9am", () => {
    // Note: using a date object directly with getDay()/getHours()
    // We test the logic by creating dates whose local day/hour we control
    const monday9am = new Date("2026-04-06T09:00:00");
    expect(isEmergencyCall(monday9am)).toBe(false);
  });

  it("returns false for Friday 4:59pm", () => {
    const fri459 = new Date("2026-04-10T16:59:00");
    expect(isEmergencyCall(fri459)).toBe(false);
  });

  it("returns true for Friday 5:00pm (at-hours boundary)", () => {
    const fri5pm = new Date("2026-04-10T17:00:00");
    expect(isEmergencyCall(fri5pm)).toBe(true);
  });

  it("returns true for Monday 7:59am (before business hours)", () => {
    const mon759 = new Date("2026-04-06T07:59:00");
    expect(isEmergencyCall(mon759)).toBe(true);
  });

  it("returns true for Saturday any time", () => {
    const sat = new Date("2026-04-11T10:00:00");
    expect(isEmergencyCall(sat)).toBe(true);
  });

  it("returns true for Sunday any time", () => {
    const sun = new Date("2026-04-12T14:00:00");
    expect(isEmergencyCall(sun)).toBe(true);
  });

  it("accepts ISO string", () => {
    // Wednesday 8am — not emergency
    expect(isEmergencyCall("2026-04-08T08:00:00")).toBe(false);
    // Wednesday midnight — emergency
    expect(isEmergencyCall("2026-04-08T00:00:00")).toBe(true);
  });
});

describe("generateGeneralItems", () => {
  it("always includes drying evaluation, PPE, and supervision", () => {
    const items = generateGeneralItems(300, false);
    const codes = items.map((i) => i.xactimateCode);
    expect(codes).toContain("WTR-EVLTN");
    expect(codes).toContain("GEN-PPE");
    expect(codes).toContain("GEN-SUPV");
  });

  it("does not include emergency fee when isEmergency=false", () => {
    const items = generateGeneralItems(300, false);
    const codes = items.map((i) => i.xactimateCode);
    expect(codes).not.toContain("GEN-EMRG");
  });

  it("includes emergency fee when isEmergency=true", () => {
    const items = generateGeneralItems(300, true);
    const codes = items.map((i) => i.xactimateCode);
    expect(codes).toContain("GEN-EMRG");
  });

  it("returns 3 items without emergency", () => {
    expect(generateGeneralItems(200, false)).toHaveLength(3);
  });

  it("returns 4 items with emergency", () => {
    expect(generateGeneralItems(200, true)).toHaveLength(4);
  });

  it("supervision name reflects small job", () => {
    const items = generateGeneralItems(100, false);
    const supv = items.find((i) => i.xactimateCode === "GEN-SUPV")!;
    expect(supv.name).toContain("small");
    expect(supv.name).toContain("$150");
  });

  it("supervision name reflects large job", () => {
    const items = generateGeneralItems(2000, false);
    const supv = items.find((i) => i.xactimateCode === "GEN-SUPV")!;
    expect(supv.name).toContain("large");
    expect(supv.name).toContain("$400");
  });
});
