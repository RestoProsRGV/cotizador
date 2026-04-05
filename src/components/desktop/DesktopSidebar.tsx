import { useLocation, useNavigate } from "react-router-dom";
import { LayoutList, Settings, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { icon: LayoutList, href: "/desktop/estimates", label: "Estimates" },
  { icon: Settings, href: "/desktop/admin/prices", label: "Admin" },
  { icon: Zap, href: "/desktop/admin/suggestion-rules", label: "Suggestion Rules" },
];

export function DesktopSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const initial = profile?.email?.charAt(0).toUpperCase() ?? "U";

  return (
    <div
      data-testid="desktop-sidebar"
      style={{
        width: "64px",
        minWidth: "64px",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        backgroundColor: "#1e2535",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "12px",
        paddingBottom: "16px",
        zIndex: 100,
      }}
    >
      {/* RP logo mark */}
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          backgroundColor: "#2196F3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "#fff", fontSize: "12px", fontWeight: 700, letterSpacing: "0.5px" }}>
          RP
        </span>
      </div>

      {/* Nav icons */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
        {NAV_ITEMS.map(({ icon: Icon, href, label }) => {
          const isActive = location.pathname.startsWith(href);
          return (
            <button
              key={href}
              type="button"
              onClick={() => navigate(href)}
              aria-label={label}
              title={label}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isActive ? "rgba(33,150,243,0.12)" : "transparent",
                color: isActive ? "#2196F3" : "#8892a4",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              }}
            >
              <Icon size={20} aria-hidden />
            </button>
          );
        })}
      </nav>

      {/* User avatar */}
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          backgroundColor: "#2196F3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "#fff", fontSize: "13px", fontWeight: 600 }}>{initial}</span>
      </div>
    </div>
  );
}
