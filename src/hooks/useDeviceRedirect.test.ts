import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDeviceRedirect } from "./useDeviceRedirect";

function setMatchMedia(standalone: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: standalone }),
  });
}

function setInnerWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
}

describe("useDeviceRedirect", () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    // Default: not standalone, wide screen
    setMatchMedia(false);
    setInnerWidth(1440);
  });

  afterEach(() => {
    setInnerWidth(originalInnerWidth);
  });

  it("returns 'mobile' when display-mode is standalone (PWA installed)", () => {
    setMatchMedia(true);
    setInnerWidth(1440);
    expect(useDeviceRedirect()).toBe("mobile");
  });

  it("returns 'desktop' when width >= 1024 and not standalone", () => {
    setMatchMedia(false);
    setInnerWidth(1024);
    expect(useDeviceRedirect()).toBe("desktop");
  });

  it("returns 'desktop' for wide desktop screen (1440px, not standalone)", () => {
    setMatchMedia(false);
    setInnerWidth(1440);
    expect(useDeviceRedirect()).toBe("desktop");
  });

  it("returns 'mobile' when width < 1024 and not standalone", () => {
    setMatchMedia(false);
    setInnerWidth(768);
    expect(useDeviceRedirect()).toBe("mobile");
  });

  it("returns 'mobile' for phone-width (375px, not standalone)", () => {
    setMatchMedia(false);
    setInnerWidth(375);
    expect(useDeviceRedirect()).toBe("mobile");
  });

  it("returns 'mobile' for PWA on iPad (width >= 1024, but standalone)", () => {
    setMatchMedia(true);
    setInnerWidth(1024);
    expect(useDeviceRedirect()).toBe("mobile");
  });
});
