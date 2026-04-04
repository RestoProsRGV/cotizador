import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi } from "vitest";
import "@/lib/i18n";
import { DesktopEstimateDetail } from "../DesktopEstimateDetail";

vi.mock("@/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    session: { user: { id: "test-user" } },
    user: { id: "test-user" },
    profile: { tenant_id: "test-tenant", role: "owner", email: "owner@test.com" },
    loading: false,
    signOut: vi.fn(),
  }),
}));

const MOCK_ESTIMATE = {
  id: "aabbccddeeff1122",
  client_name: "Juan Perez",
  job_address: "100 Main St, McAllen TX",
  job_type: "water",
  category: "cat_2",
  status: "draft",
  emergency: false,
  created_at: "2026-04-03T10:00:00Z",
};

const MOCK_AREAS = [
  {
    id: "area-1",
    estimate_id: "aabbccddeeff1122",
    name: "Master Bathroom",
    length: 10,
    width: 8,
    height: 9,
    materials: ["floor:tile"],
    material_note: null,
  },
];

const MOCK_LINE_ITEMS = [
  {
    id: "li-1",
    estimate_id: "aabbccddeeff1122",
    area_id: null,
    module: "GEN",
    name: "Drying evaluation",
    xactimate_code: "WTR-EVLTN",
    unit: "flat",
    quantity: 1,
    unit_price: 150,
    sort_order: 0,
  },
  {
    id: "li-2",
    estimate_id: "aabbccddeeff1122",
    area_id: "area-1",
    module: "DEM",
    name: "Drywall removal",
    xactimate_code: "DEM-DW-RM",
    unit: "SF",
    quantity: 80,
    unit_price: 0.5,
    sort_order: 1,
  },
];

// Mock supabase to return controlled data
vi.mock("@/lib/supabase", () => {
  const mockFrom = (table: string) => {
    const chain = {
      select: () => chain,
      eq: () => chain,
      order: () => chain,
      single: () =>
        Promise.resolve({
          data: table === "estimates" ? MOCK_ESTIMATE : null,
          error: null,
        }),
      then: undefined as unknown,
    };
    // Make chain thenable for Promise.all
    chain.then = undefined;

    // For arrays (areas, line_items)
    if (table === "areas") {
      return {
        select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: MOCK_AREAS, error: null }) }) }),
      };
    }
    if (table === "line_items") {
      return {
        select: () => ({
          eq: () => ({ order: () => Promise.resolve({ data: MOCK_LINE_ITEMS, error: null }) }),
        }),
      };
    }
    return {
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: MOCK_ESTIMATE, error: null }),
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    };
  };

  return {
    supabase: {
      from: mockFrom,
      auth: {
        getSession: () => Promise.resolve({ data: { session: { user: { id: "u1" } } } }),
      },
    },
  };
});

function renderPage(id = "aabbccddeeff1122") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/desktop/estimates/${id}`]}>
        <Routes>
          <Route path="/desktop/estimates/:id" element={<DesktopEstimateDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("DesktopEstimateDetail — tabs render", () => {
  it("renders all 4 tab labels", async () => {
    await act(async () => {
      renderPage();
    });
    expect(screen.getByRole("tab", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Areas" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "General" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Total" })).toBeInTheDocument();
  });

  it("Overview tab is active by default", async () => {
    await act(async () => {
      renderPage();
    });
    const overviewTab = screen.getByRole("tab", { name: "Overview" });
    expect(overviewTab).toHaveAttribute("aria-selected", "true");
  });

  it("clicking Areas tab makes it active", async () => {
    await act(async () => {
      renderPage();
    });
    const areasTab = screen.getByRole("tab", { name: "Areas" });
    await act(async () => {
      fireEvent.click(areasTab);
    });
    expect(areasTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute(
      "aria-selected",
      "false"
    );
  });

  it("clicking General tab makes it active", async () => {
    await act(async () => {
      renderPage();
    });
    const generalTab = screen.getByRole("tab", { name: "General" });
    await act(async () => {
      fireEvent.click(generalTab);
    });
    expect(generalTab).toHaveAttribute("aria-selected", "true");
  });

  it("clicking Total tab makes it active", async () => {
    await act(async () => {
      renderPage();
    });
    const totalTab = screen.getByRole("tab", { name: "Total" });
    await act(async () => {
      fireEvent.click(totalTab);
    });
    expect(totalTab).toHaveAttribute("aria-selected", "true");
  });
});

describe("DesktopEstimateDetail — sidebar + header", () => {
  it("renders desktop sidebar", async () => {
    await act(async () => {
      renderPage();
    });
    expect(screen.getByTestId("desktop-sidebar")).toBeInTheDocument();
  });

  it("renders breadcrumb with Estimates link", async () => {
    await act(async () => {
      renderPage();
    });
    // Breadcrumb "Estimates" appears as a clickable link
    const estimatesLinks = screen.getAllByText("Estimates");
    expect(estimatesLinks.length).toBeGreaterThan(0);
  });
});
