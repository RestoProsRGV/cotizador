import { describe, it, expect, vi, beforeEach } from "vitest";
import { HARDCODED_PRICES, getHardcodedPrice } from "@/constants/hardcodedPrices";
import { getPricingStatus } from "@/services/pricingService";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "@/lib/supabase";

const mockFrom = vi.mocked(supabase.from);

function mockSelect(data: unknown[] | null, error: unknown = null) {
  const chain = {
    select: vi.fn().mockReturnValue({ data, error }),
  };
  mockFrom.mockReturnValue(chain as unknown as ReturnType<typeof supabase.from>);
  return chain;
}

describe("HARDCODED_PRICES", () => {
  it("has expected equipment codes", () => {
    expect(HARDCODED_PRICES["EQP-AMVR"]).toBeDefined();
    expect(HARDCODED_PRICES["EQP-DH-LG"]).toBeDefined();
    expect(HARDCODED_PRICES["EQP-ASCR"]).toBeDefined();
  });

  it("has positive unit_price for all items", () => {
    for (const [code, item] of Object.entries(HARDCODED_PRICES)) {
      expect(item.unit_price, `${code} should have positive price`).toBeGreaterThanOrEqual(0);
    }
  });

  it("has description, unit, and category for every item", () => {
    for (const [code, item] of Object.entries(HARDCODED_PRICES)) {
      expect(item.description, `${code} missing description`).toBeTruthy();
      expect(item.unit, `${code} missing unit`).toBeTruthy();
      expect(item.category, `${code} missing category`).toBeTruthy();
    }
  });

  it("covers all codes from the old prices.ts", () => {
    const requiredCodes = [
      "EQP-AMVR", "EQP-DH-LG", "EQP-ASCR",
      "GEN-EMRG", "GEN-SUPV", "GEN-PPE", "GEN-HAUL",
      "CLN-HEPA", "CLN-ANTIM", "CLN-DISINF",
      "DEM-DW-RM", "DEM-FLOOD-CUT-2FT", "DEM-FLOOD-CUT-4FT",
    ];
    for (const code of requiredCodes) {
      expect(HARDCODED_PRICES[code], `Missing code ${code}`).toBeDefined();
    }
  });
});

describe("getHardcodedPrice", () => {
  it("returns unit_price for known code", () => {
    expect(getHardcodedPrice("EQP-AMVR")).toBe(15);
    expect(getHardcodedPrice("EQP-DH-LG")).toBe(50);
    expect(getHardcodedPrice("EQP-ASCR")).toBe(30);
  });

  it("returns 0 for unknown code", () => {
    expect(getHardcodedPrice("UNKNOWN-CODE")).toBe(0);
  });
});

describe("getPricingStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns hardcoded source when DB is empty", async () => {
    mockSelect([]);
    const status = await getPricingStatus();
    expect(status.source).toBe("hardcoded");
    expect(status.itemCount).toBe(Object.keys(HARDCODED_PRICES).length);
  });

  it("returns db source when DB has items", async () => {
    const dbItems = [
      { xactimate_code: "EQP-AMVR" },
      { xactimate_code: "EQP-DH-LG" },
    ];
    mockSelect(dbItems);
    const status = await getPricingStatus();
    expect(status.source).toBe("db");
    expect(status.itemCount).toBe(2);
  });

  it("falls back to hardcoded on DB error", async () => {
    const chain = { select: vi.fn().mockReturnValue({ data: null, error: new Error("DB error") }) };
    mockFrom.mockReturnValue(chain as unknown as ReturnType<typeof supabase.from>);
    const status = await getPricingStatus();
    expect(status.source).toBe("hardcoded");
  });
});
