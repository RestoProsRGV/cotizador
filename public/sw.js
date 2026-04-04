// Minimal service worker — no caching.
// Purpose: satisfy PWA installability criteria (service worker required).
// Offline caching will be added in a future session.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => {});
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
