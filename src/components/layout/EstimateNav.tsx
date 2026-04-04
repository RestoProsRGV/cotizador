import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FileText, Grid2X2, ListChecks, Receipt, Eye } from "lucide-react";

interface NavTab {
  slug: string;
  labelKey: string;
  Icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
}

// 5 fixed tabs — all visible at once on 390px, no horizontal scroll.
// Prep / Demo / Cleaning / Equipment live inside AreaDetail (per-area tabs), not here.
const TABS: NavTab[] = [
  { slug: "setup",   labelKey: "estimateNav.setup",   Icon: FileText },
  { slug: "areas",   labelKey: "estimateNav.areas",   Icon: Grid2X2 },
  { slug: "general", labelKey: "estimateNav.general", Icon: ListChecks },
  { slug: "total",   labelKey: "estimateNav.total",   Icon: Receipt },
  { slug: "present", labelKey: "estimateNav.present", Icon: Eye },
];

export function EstimateNav() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  function getActiveSlug() {
    const path = location.pathname;
    // /estimates/:id/areas/:areaId → correctly returns "areas"
    const match = path.match(/\/estimates\/[^/]+\/([^/]+)/);
    return match?.[1] ?? "";
  }

  const activeSlug = getActiveSlug();

  return (
    <nav
      aria-label={t("estimateNav.label")}
      style={{
        backgroundColor: "var(--color-surface)",
        borderTop: "1px solid var(--color-border)",
        height: "56px",
        display: "flex",
        alignItems: "stretch",
        position: "sticky",
        bottom: 0,
        zIndex: 20,
      }}
    >
      {TABS.map(({ slug, labelKey, Icon }) => {
        const isActive = activeSlug === slug ||
          // Setup tab highlights when on areas or areas/:areaId too
          (slug === "setup" && activeSlug === "areas");
        const href = `/estimates/${id}/${slug}`;

        return (
          <button
            key={slug}
            type="button"
            onClick={() => navigate(href)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "2px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              borderTop: isActive
                ? "2px solid var(--color-primary)"
                : "2px solid transparent",
              color: isActive ? "var(--color-primary)" : "var(--color-text-secondary)",
              paddingTop: "2px",
            }}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon size={18} aria-hidden />
            <span style={{ fontSize: "11px", fontWeight: 500, whiteSpace: "nowrap" }}>
              {t(labelKey)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
