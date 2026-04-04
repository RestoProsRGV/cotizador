/**
 * Registers the minimal service worker required for PWA installability.
 * No offline caching — the SW is a pass-through only.
 */
export function registerSW() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }
}
