/**
 * Detects whether the app should route to the desktop or mobile experience.
 *
 * Rules:
 * - PWA (standalone display mode) → always mobile, regardless of screen width.
 *   Techs install the PWA on their phone; standalone = field tool context.
 * - Browser width >= 1024px → desktop experience (/desktop/*)
 * - Browser width < 1024px → mobile experience (/estimates/*)
 */
export function useDeviceRedirect(): "mobile" | "desktop" {
  const isPWA = window.matchMedia("(display-mode: standalone)").matches;
  const isWide = window.innerWidth >= 1024;
  return isPWA ? "mobile" : isWide ? "desktop" : "mobile";
}
