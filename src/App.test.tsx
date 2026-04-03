import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi } from "vitest";
import "@/lib/i18n";
import { App } from "./App";

// Stub AuthContext — provide a logged-in session so RequireAuth passes
vi.mock("@/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    session: { user: { id: "test-user" } },
    user: { id: "test-user" },
    profile: { tenant_id: "test-tenant", role: "owner", email: "test@test.com" },
    loading: false,
    signOut: vi.fn(),
  }),
}));

function renderApp(initialPath = "/") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("App", () => {
  it("redirects root to /estimates", () => {
    renderApp("/");
    // After redirect to /estimates, EstimatesList renders with "My Estimates" header
    expect(screen.getByText("My Estimates")).toBeInTheDocument();
  });

  it("renders the login screen at /login", () => {
    renderApp("/login");
    expect(screen.getByText("RestoPros")).toBeInTheDocument();
  });

  it("renders the new estimate screen at /estimates/new", () => {
    renderApp("/estimates/new");
    expect(screen.getByText("New Estimate")).toBeInTheDocument();
  });
});
