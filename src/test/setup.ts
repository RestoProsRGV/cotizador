import "@testing-library/jest-dom/vitest";

// jsdom defaults window.innerWidth to 1024, which would trigger desktop redirect.
// Override to 0 so useDeviceRedirect returns 'mobile' by default in tests.
// Tests that need a specific width (e.g. useDeviceRedirect.test.ts) set it themselves.
Object.defineProperty(window, "innerWidth", {
  writable: true,
  configurable: true,
  value: 0,
});

// jsdom does not implement window.matchMedia — stub it so any component that
// calls useDeviceRedirect (or similar) doesn't throw in tests.
// Default: not standalone (matches: false), innerWidth = 0 → useDeviceRedirect
// returns 'mobile' → existing mobile-path tests pass.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  configurable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
