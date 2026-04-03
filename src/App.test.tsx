import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect } from "vitest";
import "@/lib/i18n";
import { App } from "./App";

function renderApp(initialPath = "/") {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("App", () => {
  it("renders the home page", () => {
    renderApp();
    expect(screen.getByText("RestoPros")).toBeInTheDocument();
  });

  it("renders the new estimate screen", () => {
    renderApp("/estimates/new");
    expect(screen.getByText("New Estimate")).toBeInTheDocument();
  });
});
