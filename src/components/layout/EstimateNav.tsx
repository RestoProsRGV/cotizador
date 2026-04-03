import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FileText, Grid2X2, Hammer, Sparkles, Wind, ListChecks, Receipt, Wrench } from "lucide-react";

interface NavTab {
  slug: string;
  labelKey: string;
  Icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
}

const TABS: NavTab[] = [
  { slug: "setup", labelKey: "estimateNav.setup", Icon: FileText },
  { slug: "areas", labelKey: "estimateNav.areas", Icon: Grid2X2 },
  { slug: "prep", labelKey: "estimateNav.prep", Icon: Wrench },
  { slug: "demo", labelKey: "estimateNav.demo", Icon: Hammer },
  { slug: "cleaning", labelKey: "estimateNav.cleaning", Icon: Sparkles },
  { slug: "equipment", labelKey: "estimateNav.equipment", Icon: Wind },
  { slug: "general", labelKey: "estimateNav.general", Icon: ListChecks },
  { slug: "total", labelKey: "estimateNav.total", Icon: Receipt },
];

export function EstimateNav() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  function getActiveSlug() {
    const path = location.pathname;
    // /estimates/:id/areas/:areaId → match "areas"
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
        overflowX: "auto",
        display: "flex",
        alignItems: "stretch",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        position: "sticky",
        bottom: 0,
        zIndex: 20,
      }}
    >
      {TABS.map(({ slug, labelKey, Icon }) => {
        const isActive = activeSlug === slug;
        const href = slug === "setup"
          ? `/estimates/${id}/areas`
          : `/estimates/${id}/${slug}`;

        return (
          <button
            key={slug}
            type="button"
            onClick={() => navigate(href)}
            style={{
              minWidth: "72px",
              flex: "0 0 auto",
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
