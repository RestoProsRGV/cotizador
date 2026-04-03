import { describe, it, expect } from "vitest";
import {
  recalcLineItems,
  applyManualOverride,
  clearManualOverride,
} from "./recalculation";
import type { LineItemSnapshot } from "./recalculation";

const makeItem = (overrides: Partial<LineItemSnapshot> = {}): LineItemSnapshot => ({
  id: "item-1",
  xactimateCode: "EQP-AMVR",
  quantity: 4,
  systemValue: 4,
  isManualOverride: false,
  ...overrides,
});

describe("recalcLineItems", () => {
  it("updates quantity when not manually overridden", () => {
    const existing = [makeItem({ quantity: 4, systemValue: 4, isManualOverride: false })];
    const updates = [{ id: "item-1", xactimateCode: "EQP-AMVR", newSystemValue: 6 }];
    const result = recalcLineItems(existing, updates);
    expect(result[0]!.quantity).toBe(6);
    expect(result[0]!.systemValue).toBe(6);
    expect(result[0]!.changed).toBe(true);
  });

  it("preserves quantity when manually overridden", () => {
    const existing = [makeItem({ quantity: 8, systemValue: 4, isManualOverride: true })];
    const updates = [{ id: "item-1", xactimateCode: "EQP-AMVR", newSystemValue: 6 }];
    const result = recalcLineItems(existing, updates);
    expect(result[0]!.quantity).toBe(8);        // tech's value preserved
    expect(result[0]!.systemValue).toBe(6);     // system value updated
    expect(result[0]!.isManualOverride).toBe(true);
    expect(result[0]!.changed).toBe(false);
  });

  it("marks changed=false when value does not change", () => {
    const existing = [makeItem({ quantity: 6, systemValue: 6, isManualOverride: false })];
    const updates = [{ id: "item-1", xactimateCode: "EQP-AMVR", newSystemValue: 6 }];
    const result = recalcLineItems(existing, updates);
    expect(result[0]!.changed).toBe(false);
  });

  it("leaves items untouched when no update provided", () => {
    const existing = [makeItem({ quantity: 4, xactimateCode: "GEN-PPE" })];
    const updates = [{ id: "x", xactimateCode: "EQP-AMVR", newSystemValue: 10 }];
    const result = recalcLineItems(existing, updates);
    expect(result[0]!.quantity).toBe(4);
    expect(result[0]!.changed).toBe(false);
  });

  it("handles multiple items with mixed override states", () => {
    const existing: LineItemSnapshot[] = [
      makeItem({ id: "a", xactimateCode: "EQP-AMVR", quantity: 4, systemValue: 4, isManualOverride: false }),
      makeItem({ id: "b", xactimateCode: "EQP-DH-LG", quantity: 10, systemValue: 8, isManualOverride: true }),
      makeItem({ id: "c", xactimateCode: "EQP-ASCR", quantity: 1, systemValue: 1, isManualOverride: false }),
    ];
    const updates = [
      { id: "a", xactimateCode: "EQP-AMVR", newSystemValue: 6 },
      { id: "b", xactimateCode: "EQP-DH-LG", newSystemValue: 9 },
      { id: "c", xactimateCode: "EQP-ASCR", newSystemValue: 2 },
    ];
    const results = recalcLineItems(existing, updates);

    // EQP-AMVR: not overridden → quantity updated
    expect(results[0]!.quantity).toBe(6);
    expect(results[0]!.changed).toBe(true);

    // EQP-DH-LG: overridden → quantity preserved, systemValue updated
    expect(results[1]!.quantity).toBe(10);
    expect(results[1]!.systemValue).toBe(9);
    expect(results[1]!.changed).toBe(false);

    // EQP-ASCR: not overridden → quantity updated
    expect(results[2]!.quantity).toBe(2);
    expect(results[2]!.changed).toBe(true);
  });
});

describe("applyManualOverride", () => {
  it("sets isManualOverride to true", () => {
    const item = makeItem({ quantity: 4, isManualOverride: false });
    const result = applyManualOverride(item, 8);
    expect(result.isManualOverride).toBe(true);
  });

  it("updates quantity to the new value", () => {
    const item = makeItem({ quantity: 4 });
    const result = applyManualOverride(item, 8);
    expect(result.quantity).toBe(8);
  });

  it("preserves systemValue from original", () => {
    const item = makeItem({ quantity: 4, systemValue: 4 });
    const result = applyManualOverride(item, 8);
    expect(result.systemValue).toBe(4);
  });

  it("falls back to current quantity when systemValue is null", () => {
    const item = makeItem({ quantity: 4, systemValue: null });
    const result = applyManualOverride(item, 8);
    expect(result.systemValue).toBe(4);
  });
});

describe("clearManualOverride", () => {
  it("sets isManualOverride to false", () => {
    const item = makeItem({ quantity: 8, systemValue: 4, isManualOverride: true });
    const result = clearManualOverride(item);
    expect(result.isManualOverride).toBe(false);
  });

  it("restores quantity to systemValue", () => {
    const item = makeItem({ quantity: 8, systemValue: 4, isManualOverride: true });
    const result = clearManualOverride(item);
    expect(result.quantity).toBe(4);
  });

  it("falls back to quantity when systemValue is null", () => {
    const item = makeItem({ quantity: 8, systemValue: null, isManualOverride: true });
    const result = clearManualOverride(item);
    expect(result.quantity).toBe(8);
  });
});
