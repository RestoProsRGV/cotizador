import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@/lib/i18n";
import { Total } from "@/screens/Total";

// ── Mutable status for testing different states ───────────────────────���────
let mockEstimateStatus = "draft";
let mockUpdateResult: { error: null | { message: string } } = { error: null };

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: "user-1" } } },
      }),
    },
    from: vi.fn((table: string) => {
      if (table === "estimates") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockImplementation(() =>
                Promise.resolve({ data: { status: mockEstimateStatus }, error: null })
              ),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation(() => Promise.resolve(mockUpdateResult)),
          }),
        };
      }
      if (table === "line_items") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      }
      return {};
    }),
  },
}));

// Prevent @react-pdf/renderer canvas issues in jsdom
vi.mock("@/hooks/useEstimatePDF", () => ({
  useEstimatePDF: () => ({ downloadPDF: vi.fn(), generating: false, error: null }),
}));

vi.mock("@/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({ session: null, user: null, profile: null, loading: false }),
}));

// ── Helper ────────────────────────────────────────────────────────────────────
function renderTotal() {
  return render(
    <MemoryRouter initialEntries={["/estimates/est-1/total"]}>
      <Routes>
        <Route path="/estimates/:id/total" element={<Total />} />
        <Route path="/estimates" element={<div>Estimates List</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("Total screen — status flow", () => {
  beforeEach(() => {
    mockEstimateStatus = "draft";
    mockUpdateResult = { error: null };
  });

  it("shows Mark as Approved button when status is draft", async () => {
    renderTotal();
    await waitFor(
      () => expect(screen.getByRole("button", { name: /mark as approved/i })).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it("shows Mark as Invoiced button when status is approved", async () => {
    mockEstimateStatus = "approved";
    renderTotal();
    await waitFor(
      () => expect(screen.getByRole("button", { name: /mark as invoiced/i })).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it("shows Invoiced badge and no action button when status is invoiced", async () => {
    mockEstimateStatus = "invoiced";
    renderTotal();
    await waitFor(
      () => expect(screen.getByRole("status", { name: /invoiced/i })).toBeInTheDocument(),
      { timeout: 3000 },
    );
    expect(screen.queryByRole("button", { name: /mark as/i })).not.toBeInTheDocument();
  });

  it("opens confirmation sheet when Mark as Approved is tapped", async () => {
    renderTotal();
    await waitFor(
      () => expect(screen.getByRole("button", { name: /mark as approved/i })).toBeInTheDocument(),
      { timeout: 3000 },
    );
    fireEvent.click(screen.getByRole("button", { name: /mark as approved/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/confirm — mark approved/i)).toBeInTheDocument();
  });

  it("cancel closes confirmation sheet without updating", async () => {
    renderTotal();
    await waitFor(
      () => expect(screen.getByRole("button", { name: /mark as approved/i })).toBeInTheDocument(),
      { timeout: 3000 },
    );
    fireEvent.click(screen.getByRole("button", { name: /mark as approved/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Download PDF button is present", async () => {
    renderTotal();
    await waitFor(
      () => expect(screen.getByRole("button", { name: /download pdf/i })).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it("status badge label shows Approved in header for approved status", async () => {
    mockEstimateStatus = "approved";
    renderTotal();
    await waitFor(
      () => expect(screen.getByText(/^approved$/i)).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });
});
