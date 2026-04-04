import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@/lib/i18n";
import { Setup } from "@/screens/Setup";

// ── Supabase mock ────────────────────────────────────────────────────────────
const MOCK_ESTIMATE = {
  id: "est-1",
  client_name: "Maria Lopez",
  job_address: "123 Main St",
  job_type: "water",
  category: "cat2",
  emergency: false,
  // Monday 2pm UTC = 2pm UTC, biz hours in UTC — isEmergencyCall mocked anyway
  created_at: "2026-04-06T20:00:00.000Z",
};

const mockEqUpdate = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate });

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === "estimates") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: MOCK_ESTIMATE, error: null }),
            }),
          }),
          update: mockUpdate,
        };
      }
      return {};
    }),
  },
}));

// Mock isEmergencyCall so tests don't depend on local timezone
vi.mock("@/lib/logic/general", () => ({
  isEmergencyCall: vi.fn().mockReturnValue(false),
}));

// ── Auth mock ────────────────────────────────────────────────────────────────
vi.mock("@/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    session: { user: { id: "test-user" } },
    user: { id: "test-user" },
    profile: { tenant_id: "test-tenant", role: "owner" },
    loading: false,
    signOut: vi.fn(),
  }),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────
function renderSetup(estimateId = "est-1") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/estimates/${estimateId}/setup`]}>
        <Routes>
          <Route path="/estimates/:id/setup" element={<Setup />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe("Setup screen", () => {
  beforeEach(() => {
    mockUpdate.mockClear();
    mockEqUpdate.mockClear();
  });

  it("renders the Setup heading", async () => {
    renderSetup();
    // Use role query to avoid ambiguity with the EstimateNav "Setup" tab span
    expect(screen.getByRole("heading", { name: /setup/i })).toBeInTheDocument();
  });

  it("populates client name from fetched estimate", async () => {
    renderSetup();
    await waitFor(
      () => expect(screen.getByDisplayValue("Maria Lopez")).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it("populates address from fetched estimate", async () => {
    renderSetup();
    await waitFor(
      () => expect(screen.getByDisplayValue("123 Main St")).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it("shows Water job type selected after data loads", async () => {
    renderSetup();
    await waitFor(
      () => {
        const waterBtn = screen.getByRole("button", { name: /^water$/i });
        expect(waterBtn).toHaveAttribute("aria-pressed", "true");
      },
      { timeout: 3000 },
    );
  });

  it("shows water category selector when job type is water", async () => {
    renderSetup();
    await waitFor(
      () => expect(screen.getByText("Water Category")).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it("shows Cat 2 selected", async () => {
    renderSetup();
    await waitFor(
      () => {
        const cat2Btn = screen.getByRole("button", { name: /cat 2/i });
        expect(cat2Btn).toHaveAttribute("aria-pressed", "true");
      },
      { timeout: 3000 },
    );
  });

  it("renders all 4 job type options including Fire", async () => {
    renderSetup();
    await waitFor(
      () => {
        expect(screen.getByRole("button", { name: /^water$/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^mold$/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^storm$/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^fire$/i })).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("hides water category selector when Fire is selected", async () => {
    renderSetup();
    await waitFor(
      () => expect(screen.getByRole("button", { name: /^fire$/i })).toBeInTheDocument(),
      { timeout: 3000 },
    );
    fireEvent.click(screen.getByRole("button", { name: /^fire$/i }));
    expect(screen.queryByText("Water Category")).not.toBeInTheDocument();
  });

  it("shows EstimateNav at the bottom", () => {
    renderSetup();
    expect(
      screen.getByRole("navigation", { name: /estimate sections/i }),
    ).toBeInTheDocument();
  });

  it("does not show emergency badge (mocked as non-emergency)", async () => {
    renderSetup();
    await waitFor(
      () => expect(screen.getByDisplayValue("Maria Lopez")).toBeInTheDocument(),
      { timeout: 3000 },
    );
    expect(screen.queryByText("Emergency Call")).not.toBeInTheDocument();
  });
});
