import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { useDeviceRedirect } from "@/hooks/useDeviceRedirect";
import { Login } from "@/screens/Login";
import { EstimatesList } from "@/screens/EstimatesList";
import { NewEstimate } from "@/screens/NewEstimate";
import { Areas } from "@/screens/Areas";
import { AreaDetail } from "@/screens/AreaDetail";
import { General } from "@/screens/General";
import { Total } from "@/screens/Total";
import { Setup } from "@/screens/Setup";
import { Present } from "@/screens/Present";
import { OfflineBanner } from "@/components/OfflineBanner";
import { DesktopLoadingShell } from "@/components/DesktopLoadingShell";

// Lazy-loaded: desktop and admin routes are never needed on mobile field tool
const AdminPrices = lazy(() => import("@/screens/admin/AdminPrices").then(m => ({ default: m.AdminPrices })));
const DesktopEstimatesList = lazy(() => import("@/pages/desktop/DesktopEstimatesList").then(m => ({ default: m.DesktopEstimatesList })));
const DesktopEstimateDetail = lazy(() => import("@/pages/desktop/DesktopEstimateDetail").then(m => ({ default: m.DesktopEstimateDetail })));
const DesktopAdminPrices = lazy(() => import("@/pages/desktop/DesktopAdminPrices").then(m => ({ default: m.DesktopAdminPrices })));
const DesktopSuggestionRules = lazy(() => import("@/pages/desktop/DesktopSuggestionRules").then(m => ({ default: m.DesktopSuggestionRules })));

// Route architecture:
//   /                → RootRedirect: desktop browser → /desktop/estimates, mobile/PWA → /estimates
//   /login           → public login screen
//   /estimates       → RootRedirect (same logic as /)
//   /estimates/*     → mobile field estimation (touch-optimized, on-site)
//   /admin/*         → admin screens (owner only, works on desktop too)
//   /desktop/*       → desktop review and management UI

/** Redirects / to /desktop/estimates (wide browser) or /estimates (mobile/PWA). */
function RootRedirect() {
  const mode = useDeviceRedirect();
  return <Navigate to={mode === "desktop" ? "/desktop/estimates" : "/estimates"} replace />;
}

/**
 * Entry point for /estimates (exact).
 * Desktop browser → redirect to /desktop/estimates.
 * Mobile/PWA → render EstimatesList directly (no redirect, avoids loop).
 */
function EstimatesEntryPoint() {
  const mode = useDeviceRedirect();
  if (mode === "desktop") return <Navigate to="/desktop/estimates" replace />;
  return <EstimatesList />;
}

export function App() {
  return (
    <>
      <OfflineBanner />
      <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/estimates/:id/present" element={<Present />} />

      {/* Smart entry-point redirect: desktop browser → /desktop/estimates, mobile/PWA → /estimates */}
      <Route path="/" element={<RootRedirect />} />

      {/* ── Mobile: field estimation ── */}
      <Route
        path="/estimates"
        element={
          <RequireAuth>
            <EstimatesEntryPoint />
          </RequireAuth>
        }
      />
      <Route
        path="/estimates/new"
        element={
          <RequireAuth>
            <NewEstimate />
          </RequireAuth>
        }
      />
      <Route
        path="/estimates/:id/setup"
        element={
          <RequireAuth>
            <Setup />
          </RequireAuth>
        }
      />
      <Route
        path="/estimates/:id/areas"
        element={
          <RequireAuth>
            <Areas />
          </RequireAuth>
        }
      />
      <Route
        path="/estimates/:id/areas/:areaId"
        element={
          <RequireAuth>
            <AreaDetail />
          </RequireAuth>
        }
      />
      {/* Prep/Demo/Cleaning/Equipment are now per-area inside AreaDetail.
          Redirect old top-level routes to the areas list. */}
      <Route path="/estimates/:id/prep"      element={<Navigate to="../areas" relative="path" replace />} />
      <Route path="/estimates/:id/demo"      element={<Navigate to="../areas" relative="path" replace />} />
      <Route path="/estimates/:id/cleaning"  element={<Navigate to="../areas" relative="path" replace />} />
      <Route path="/estimates/:id/equipment" element={<Navigate to="../areas" relative="path" replace />} />

      <Route
        path="/estimates/:id/general"
        element={
          <RequireAuth>
            <General />
          </RequireAuth>
        }
      />
      <Route
        path="/estimates/:id/total"
        element={
          <RequireAuth>
            <Total />
          </RequireAuth>
        }
      />

      {/* ── Admin: owner-only configuration (lazy — not needed on mobile) ── */}
      <Route
        path="/admin/prices"
        element={
          <RequireAuth requireOwner>
            <Suspense fallback={<DesktopLoadingShell />}>
              <AdminPrices />
            </Suspense>
          </RequireAuth>
        }
      />

      {/* ── Desktop: review and management UI (lazy — never loaded on mobile) ── */}
      <Route
        path="/desktop/estimates"
        element={
          <RequireAuth>
            <Suspense fallback={<DesktopLoadingShell />}>
              <DesktopEstimatesList />
            </Suspense>
          </RequireAuth>
        }
      />
      <Route
        path="/desktop/estimates/:id"
        element={
          <RequireAuth>
            <Suspense fallback={<DesktopLoadingShell />}>
              <DesktopEstimateDetail />
            </Suspense>
          </RequireAuth>
        }
      />
      <Route
        path="/desktop/admin/prices"
        element={
          <RequireAuth requireOwner>
            <Suspense fallback={<DesktopLoadingShell />}>
              <DesktopAdminPrices />
            </Suspense>
          </RequireAuth>
        }
      />
      <Route
        path="/desktop/admin/suggestion-rules"
        element={
          <RequireAuth requireOwner>
            <Suspense fallback={<DesktopLoadingShell />}>
              <DesktopSuggestionRules />
            </Suspense>
          </RequireAuth>
        }
      />
    </Routes>
    </>
  );
}
