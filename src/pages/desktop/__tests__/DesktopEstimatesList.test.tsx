import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi } from "vitest";
import "@/lib/i18n";
import { DesktopEstimatesList } from "../DesktopEstimatesList";
import { EstimatesTable } from "@/components/desktop/EstimatesTable";

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

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/desktop/estimates"]}>
        <DesktopEstimatesList />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("DesktopEstimatesList", () => {
  it("renders the page heading", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "Estimates" })).toBeInTheDocument();
  });

  it("renders New Estimate button", () => {
    renderPage();
    expect(screen.getByRole("button", { name: /new estimate/i })).toBeInTheDocument();
  });

  it("renders the search input", () => {
    renderPage();
    expect(screen.getByRole("searchbox", { name: /search estimates/i })).toBeInTheDocument();
  });

  it("renders the status filter", () => {
    renderPage();
    expect(screen.getByRole("combobox", { name: /filter by status/i })).toBeInTheDocument();
  });

  it("renders the desktop sidebar", () => {
    renderPage();
    expect(screen.getByTestId("desktop-sidebar")).toBeInTheDocument();
  });

  it("renders the RP logo mark", () => {
    renderPage();
    expect(screen.getByText("RP")).toBeInTheDocument();
  });

  it("renders org name in header", () => {
    renderPage();
    expect(screen.getByText("RestoPros RGV")).toBeInTheDocument();
  });
});

describe("EstimatesTable — static rendering", () => {
  it("renders empty state when estimates is empty", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <EstimatesTable estimates={[]} totals={{}} onRowClick={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(container.textContent).toContain("No estimates yet");
  });

  it("renders all column headers when data is present", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const estimates = [
      {
        id: "abc123def456",
        client_name: "Juan Perez",
        job_address: "100 Main St",
        job_type: "water",
        category: null,
        status: "draft",
        emergency: false,
        created_at: "2026-04-03T10:00:00Z",
      },
    ];
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <EstimatesTable estimates={estimates} totals={{}} onRowClick={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(screen.getByText("Client")).toBeInTheDocument();
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("renders a row for each estimate", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const estimates = [
      {
        id: "abc123def456",
        client_name: "Juan Perez",
        job_address: "100 Main St",
        job_type: "water",
        category: "cat_2",
        status: "draft",
        emergency: false,
        created_at: "2026-04-03T10:00:00Z",
      },
      {
        id: "xyz789uvw012",
        client_name: "Maria Lopez",
        job_address: "200 Oak Ave",
        job_type: "mold",
        category: null,
        status: "approved",
        emergency: true,
        created_at: "2026-04-02T08:00:00Z",
      },
    ];
    const { getAllByRole } = render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <EstimatesTable estimates={estimates} totals={{}} onRowClick={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>
    );
    // 1 header row + 2 data rows
    expect(getAllByRole("row")).toHaveLength(3);
  });

  it("calls onRowClick when a row is clicked", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const onRowClick = vi.fn();
    const estimates = [
      {
        id: "abc123def456",
        client_name: "Juan Perez",
        job_address: "100 Main St",
        job_type: "water",
        category: null,
        status: "draft",
        emergency: false,
        created_at: "2026-04-03T10:00:00Z",
      },
    ];
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <EstimatesTable estimates={estimates} totals={{}} onRowClick={onRowClick} />
        </MemoryRouter>
      </QueryClientProvider>
    );
    // Click the data row (second row — first is header)
    const rows = screen.getAllByRole("row");
    fireEvent.click(rows[1]!);
    expect(onRowClick).toHaveBeenCalledWith("abc123def456");
  });

  it("shows EMRG badge for emergency estimates", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const estimates = [
      {
        id: "abc123def456",
        client_name: "Juan Perez",
        job_address: "100 Main St",
        job_type: "water",
        category: null,
        status: "draft",
        emergency: true,
        created_at: "2026-04-03T10:00:00Z",
      },
    ];
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <EstimatesTable estimates={estimates} totals={{}} onRowClick={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(screen.getByText("EMRG")).toBeInTheDocument();
  });
});

describe("DesktopEstimatesList — search filter", () => {
  it("search input accepts text", () => {
    renderPage();
    const searchInput = screen.getByRole("searchbox", { name: /search estimates/i });
    fireEvent.change(searchInput, { target: { value: "Juan" } });
    expect((searchInput as HTMLInputElement).value).toBe("Juan");
  });

  it("status filter changes value", () => {
    renderPage();
    const select = screen.getByRole("combobox", { name: /filter by status/i });
    fireEvent.change(select, { target: { value: "approved" } });
    expect((select as HTMLSelectElement).value).toBe("approved");
  });
});
