import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export interface Breadcrumb {
  label: string;
  href?: string;
}

interface DesktopHeaderProps {
  breadcrumbs: Breadcrumb[];
}

export function DesktopHeader({ breadcrumbs }: DesktopHeaderProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const initial = profile?.email?.charAt(0).toUpperCase() ?? "U";

  return (
    <header
      style={{
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        backgroundColor: "#fff",
        borderBottom: "1px solid #e5e7eb",
        flexShrink: 0,
      }}
    >
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {breadcrumbs.map((bc, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {i > 0 && (
              <span style={{ color: "#9ca3af", fontSize: "14px" }}>/</span>
            )}
            {bc.href ? (
              <button
                type="button"
                onClick={() => navigate(bc.href!)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#2196F3",
                  fontSize: "14px",
                  fontWeight: 500,
                  padding: 0,
                }}
              >
                {bc.label}
              </button>
            ) : (
              <span style={{ color: "#374151", fontSize: "14px", fontWeight: 500 }}>
                {bc.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
          RestoPros RGV
        </span>
        <button
          type="button"
          aria-label="Notifications"
          style={{
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#6b7280",
            borderRadius: "6px",
          }}
        >
          <Bell size={18} aria-hidden />
        </button>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            backgroundColor: "#2196F3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "#fff", fontSize: "13px", fontWeight: 600 }}>{initial}</span>
        </div>
      </div>
    </header>
  );
}
