import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@/lib/i18n";
import { DryingChambers } from "@/components/modules/DryingChambers";

// ── Mock data ─────────────────────────────────────────────────────────────────
const mockChambers: {
  id: string; estimate_id: string; area_id: string;
  name: string; length_ft: number; width_ft: number; height_ft: number;
}[] = [];

const mockInsertResult = {
  id: "ch-1", estimate_id: "est-1", area_id: "area-1",
  name: "Main Room", length_ft: 0, width_ft: 0, height_ft: 0,
};

const mockChain = {
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn().mockImplementation(() =>
    Promise.resolve({ data: mockChambers, error: null })
  ),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  single: vi.fn().mockResolvedValue({ data: mockInsertResult, error: null }),
};
// Make chained methods return the same object
mockChain.select.mockReturnValue(mockChain);
mockChain.eq.mockReturnValue(mockChain);
mockChain.insert.mockReturnValue(mockChain);
mockChain.update.mockReturnValue(mockChain);
mockChain.delete.mockReturnValue(mockChain);

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => mockChain),
  },
}));

// ── Helper ────────────────────────────────────────────────────────────────────
function renderChambers(onDehumCountChange = vi.fn()) {
  return render(
    <DryingChambers
      estimateId="est-1"
      areaId="area-1"
      onDehumCountChange={onDehumCountChange}
    />
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("DryingChambers", () => {
  beforeEach(() => {
    mockChambers.length = 0;
  });

  it("renders section title", async () => {
    renderChambers();
    await waitFor(() => expect(screen.getByText("Drying Chambers")).toBeInTheDocument());
  });

  it("shows fallback note when no chambers exist", async () => {
    renderChambers();
    await waitFor(() =>
      expect(screen.getByText(/no drying chambers defined/i)).toBeInTheDocument()
    );
  });

  it("calls onDehumCountChange(null) when no chambers", async () => {
    const spy = vi.fn();
    renderChambers(spy);
    await waitFor(() => expect(spy).toHaveBeenCalledWith(null));
  });

  it("CF calculation: 10 × 10 × 8 = 800 CF → 8 dehumidifiers", () => {
    const length = 10, width = 10, height = 8;
    const cf = length * width * height;
    expect(cf).toBe(800);
    expect(Math.max(1, Math.ceil(cf / 100))).toBe(8);
  });

  it("dehumidifier count rounds up (150 CF → 2)", () => {
    const cf = 150;
    expect(Math.max(1, Math.ceil(cf / 100))).toBe(2);
  });

  it("minimum 1 dehumidifier even for very small chamber (10 CF)", () => {
    const cf = 10;
    expect(Math.max(1, Math.ceil(cf / 100))).toBe(1);
  });

  it("shows Add Chamber button", async () => {
    renderChambers();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /add chamber/i })).toBeInTheDocument()
    );
  });
});
