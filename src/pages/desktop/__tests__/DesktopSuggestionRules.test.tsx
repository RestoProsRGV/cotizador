import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@/lib/i18n";
import { DesktopSuggestionRules } from "@/pages/desktop/DesktopSuggestionRules";

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_RULES = [
  {
    id: "rule-1",
    tenant_id: "tenant-1",
    trigger_item_code: "DEM-FLOOD-CUT-4FT",
    suggested_item_code: "DEM-INSUL-RM",
    qty_formula: "multiplier",
    qty_multiplier: 4,
    active: true,
  },
  {
    id: "rule-2",
    tenant_id: "tenant-1",
    trigger_item_code: "DEM-FLOOD-CUT-4FT",
    suggested_item_code: "DEM-BSBD-RM",
    qty_formula: "multiplier",
    qty_multiplier: 1,
    active: true,
  },
  {
    id: "rule-3",
    tenant_id: "tenant-1",
    trigger_item_code: "DEM-CARP-RM",
    suggested_item_code: "DEM-CARP-PAD-RM",
    qty_formula: "same_qty",
    qty_multiplier: null,
    active: true,
  },
];

// ── Supabase mock ─────────────────────────────────────────────────────────────

const mockEq = vi.fn();
const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockDelete = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === "suggestion_rules") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: MOCK_RULES, error: null }),
          }),
          update: mockUpdate,
          insert: mockInsert,
          delete: mockDelete,
        };
      }
      return {};
    }),
  },
}));

// ── Auth mock — owner ─────────────────────────────────────────────────────────

vi.mock("@/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    session: { user: { id: "test-user" } },
    user: { id: "test-user" },
    profile: { tenant_id: "tenant-1", role: "owner", email: "owner@test.com" },
    loading: false,
    signOut: vi.fn(),
  }),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/desktop/admin/suggestion-rules"]}>
        <Routes>
          <Route path="/desktop/admin/suggestion-rules" element={<DesktopSuggestionRules />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("DesktopSuggestionRules", () => {
  beforeEach(() => {
    mockUpdate.mockClear();
    mockInsert.mockClear();
    mockEq.mockClear();
  });

  it("renders the Suggestion Rules breadcrumb", () => {
    renderPage();
    expect(screen.getByText("Suggestion Rules")).toBeInTheDocument();
  });

  it("renders trigger items in the left panel", async () => {
    renderPage();
    await waitFor(() => {
      // DEM-FLOOD-CUT-4FT maps to "Drywall Flood Cut 4ft"
      expect(screen.getByText("Drywall Flood Cut 4ft")).toBeInTheDocument();
      // DEM-CARP-RM maps to "Carpet Removal"
      expect(screen.getByText("Carpet Removal")).toBeInTheDocument();
    });
  });

  it("shows suggestion count badge for each trigger", async () => {
    renderPage();
    await waitFor(() => {
      // DEM-FLOOD-CUT-4FT has 2 suggestions
      const badges = screen.getAllByText("2");
      expect(badges.length).toBeGreaterThan(0);
      // DEM-CARP-RM has 1 suggestion
      const badge1 = screen.getAllByText("1");
      expect(badge1.length).toBeGreaterThan(0);
    });
  });

  it("clicking a trigger shows its suggestions in the right panel", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Drywall Flood Cut 4ft")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText("Drywall Flood Cut 4ft"));
    // Right panel header shows trigger name
    await waitFor(() => {
      // Should show the trigger's suggestions
      expect(screen.getByText("Suggests these items:")).toBeInTheDocument();
    });
  });

  it("shows empty state message when no trigger is selected", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Select a trigger item")).toBeInTheDocument(),
    );
  });

  it("Add Rule button shows the add trigger form", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /add rule/i })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /add rule/i }));
    expect(screen.getByText("Select trigger item:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^create$/i })).toBeInTheDocument();
  });

  it("toggling active calls supabase update", async () => {
    mockEq.mockResolvedValue({ error: null });

    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Carpet Removal")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText("Carpet Removal"));

    await waitFor(() =>
      expect(screen.getByText("Suggests these items:")).toBeInTheDocument(),
    );

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThan(0);
    fireEvent.click(checkboxes[0]!);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
    });
  });
});
