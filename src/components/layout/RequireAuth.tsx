/**
 * RequireAuth — redirect to /login if no session.
 * Used as a wrapper around protected routes.
 */
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface RequireAuthProps {
  children: React.ReactNode;
  requireOwner?: boolean;
}

export function RequireAuth({ children, requireOwner = false }: RequireAuthProps) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }}
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireOwner && profile?.role !== "owner") {
    return <Navigate to="/estimates" replace />;
  }

  return <>{children}</>;
}
