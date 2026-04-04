import { Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { Login } from "@/screens/Login";
import { EstimatesList } from "@/screens/EstimatesList";
import { NewEstimate } from "@/screens/NewEstimate";
import { Areas } from "@/screens/Areas";
import { AreaDetail } from "@/screens/AreaDetail";
import { General } from "@/screens/General";
import { Total } from "@/screens/Total";
import { Present } from "@/screens/Present";
import { AdminPrices } from "@/screens/admin/AdminPrices";

// Route architecture:
//   /                → redirect to /estimates (mobile field tool)
//   /login           → public login screen
//   /estimates/*     → mobile field estimation (touch-optimized, on-site)
//   /admin/*         → admin screens (owner only, works on desktop too)
//   /desktop/*       → reserved for future desktop-only views (see CLAUDE.md)
//
// Desktop views planned for future session — see CLAUDE.md architecture notes.

export function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/estimates/:id/present" element={<Present />} />

      {/* Redirect root → estimates list (mobile entry point) */}
      <Route path="/" element={<Navigate to="/estimates" replace />} />

      {/* ── Mobile: field estimation ── */}
      <Route
        path="/estimates"
        element={
          <RequireAuth>
            <EstimatesList />
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

      {/* ── Admin: owner-only configuration ── */}
      <Route
        path="/admin/prices"
        element={
          <RequireAuth requireOwner>
            <AdminPrices />
          </RequireAuth>
        }
      />

      {/* ── Desktop: reserved for future desktop-only views ── */}
      {/* /desktop/* routes will be built in a future session.
          They will share the same Supabase backend + auth but provide
          a wider-canvas UI for reporting, suggestion rule editing,
          material management, and multi-estimate review. */}
    </Routes>
  );
}
