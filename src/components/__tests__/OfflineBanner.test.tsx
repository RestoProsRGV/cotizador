import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { OfflineBanner } from "@/components/OfflineBanner";

// navigator.onLine is read-only — use Object.defineProperty to control it
function setOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    get: () => value,
  });
}

describe("OfflineBanner", () => {
  beforeEach(() => {
    setOnline(true); // start online by default
  });

  afterEach(() => {
    setOnline(true); // restore
  });

  it("does not render when online", () => {
    render(<OfflineBanner />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders the banner when navigator.onLine is false at mount", () => {
    setOnline(false);
    render(<OfflineBanner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/no internet connection/i)).toBeInTheDocument();
  });

  it("shows banner when offline event fires", () => {
    render(<OfflineBanner />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/no internet connection/i)).toBeInTheDocument();
  });

  it("hides banner when online event fires after going offline", () => {
    setOnline(false);
    render(<OfflineBanner />);
    expect(screen.getByRole("status")).toBeInTheDocument();

    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event("online"));
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
