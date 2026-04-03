import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect } from "vitest";
import { App } from "./App";

function renderApp() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("App", () => {
  it("renders the home page", () => {
    renderApp();
    expect(screen.getByText("Cotizador")).toBeInTheDocument();
  });
});
