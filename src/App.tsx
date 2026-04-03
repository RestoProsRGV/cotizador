import { Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { Login } from "@/screens/Login";
import { EstimatesList } from "@/screens/EstimatesList";
import { NewEstimate } from "@/screens/NewEstimate";
import { Areas } from "@/screens/Areas";
import { Demo } from "@/screens/Demo";
import { Cleaning } from "@/screens/Cleaning";
import { Equipment } from "@/screens/Equipment";
import { General } from "@/screens/General";
import { Total } from "@/screens/Total";
import { Present } from "@/screens/Present";
import { AdminPrices } from "@/screens/admin/AdminPrices";

export function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/estimates/:id/present" element={<Present />} />

      {/* Redirect root → estimates list */}
      <Route path="/" element={<Navigate to="/estimates" replace />} />

      {/* Protected: tech + owner */}
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
        path="/estimates/:id/demo"
        element={
          <RequireAuth>
            <Demo />
          </RequireAuth>
        }
      />
      <Route
        path="/estimates/:id/cleaning"
        element={
          <RequireAuth>
            <Cleaning />
          </RequireAuth>
        }
      />
      <Route
        path="/estimates/:id/equipment"
        element={
          <RequireAuth>
            <Equipment />
          </RequireAuth>
        }
      />
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

      {/* Protected: owner only */}
      <Route
        path="/admin/prices"
        element={
          <RequireAuth requireOwner>
            <AdminPrices />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
