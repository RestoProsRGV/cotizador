/**
 * Unit tests for the Xactimate XLSX parser logic (pure parsing, no file I/O).
 * We test the column-mapping and code-generation logic directly.
 */
import { describe, it, expect } from "vitest";

// Re-implement the pure parsing logic here (extracted from parseXactimatePriceList)
// so we can test without FileReader/DOM
function buildPriceItem(row: (string | number | undefined)[]): {
  xactimate_code: string;
  name: string;
  unit: string;
  unit_price: number;
} | null {
  const cat = String(row[28] ?? "").trim();
  const sel = String(row[29] ?? "").trim();
  const desc = String(row[2] ?? "").trim();
  const unitCostRaw = row[8];
  const unit = String(row[9] ?? "").trim() || "EA";

  if (!cat || !sel || !desc) return null;

  const unitCost =
    typeof unitCostRaw === "number"
      ? unitCostRaw
      : parseFloat(String(unitCostRaw ?? "0").replace(/[^0-9.-]/g, ""));

  if (isNaN(unitCost) || unitCost < 0) return null;

  return {
    xactimate_code: `${cat}/${sel}`,
    name: desc,
    unit,
    unit_price: Math.round(unitCost * 100) / 100,
  };
}

function makeRow(overrides: Record<number, string | number | undefined> = {}): (string | number | undefined)[] {
  const row: (string | number | undefined)[] = new Array(35).fill(undefined);
  row[2] = "Default Description";
  row[8] = 1.50;
  row[9] = "SF";
  row[28] = "WTR";
  row[29] = "DRY";
  Object.entries(overrides).forEach(([k, v]) => { row[Number(k)] = v; });
  return row;
}

describe("buildPriceItem — code generation", () => {
  it("generates code as Cat/Sel", () => {
    const item = buildPriceItem(makeRow({ 28: "WTR", 29: "DRY" }));
    expect(item?.xactimate_code).toBe("WTR/DRY");
  });

  it("generates code as EQP/AMVR", () => {
    const item = buildPriceItem(makeRow({ 28: "EQP", 29: "AMVR" }));
    expect(item?.xactimate_code).toBe("EQP/AMVR");
  });

  it("uses Description from col 2", () => {
    const item = buildPriceItem(makeRow({ 2: "Water Extraction" }));
    expect(item?.name).toBe("Water Extraction");
  });

  it("uses Unit from col 9", () => {
    const item = buildPriceItem(makeRow({ 9: "LF" }));
    expect(item?.unit).toBe("LF");
  });

  it("defaults unit to EA when col 9 is empty", () => {
    const item = buildPriceItem(makeRow({ 9: "" }));
    expect(item?.unit).toBe("EA");
  });
});

describe("buildPriceItem — unit cost parsing", () => {
  it("accepts numeric unit cost", () => {
    const item = buildPriceItem(makeRow({ 8: 2.75 }));
    expect(item?.unit_price).toBe(2.75);
  });

  it("parses string unit cost with dollar sign", () => {
    const item = buildPriceItem(makeRow({ 8: "$3.50" }));
    expect(item?.unit_price).toBe(3.50);
  });

  it("rounds to 2 decimal places", () => {
    const item = buildPriceItem(makeRow({ 8: 1.2345 }));
    expect(item?.unit_price).toBe(1.23);
  });

  it("returns null for negative unit cost", () => {
    const item = buildPriceItem(makeRow({ 8: -1 }));
    expect(item).toBeNull();
  });

  it("accepts zero unit cost", () => {
    const item = buildPriceItem(makeRow({ 8: 0 }));
    expect(item?.unit_price).toBe(0);
  });
});

describe("buildPriceItem — validation", () => {
  it("returns null when Cat is empty", () => {
    expect(buildPriceItem(makeRow({ 28: "" }))).toBeNull();
  });

  it("returns null when Sel is empty", () => {
    expect(buildPriceItem(makeRow({ 29: "" }))).toBeNull();
  });

  it("returns null when Description is empty", () => {
    expect(buildPriceItem(makeRow({ 2: "" }))).toBeNull();
  });

  it("returns null when Description is whitespace only", () => {
    expect(buildPriceItem(makeRow({ 2: "   " }))).toBeNull();
  });

  it("trims whitespace from Cat and Sel", () => {
    const item = buildPriceItem(makeRow({ 28: "  WTR  ", 29: "  DRY  " }));
    expect(item?.xactimate_code).toBe("WTR/DRY");
  });
});
