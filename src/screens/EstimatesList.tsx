import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Search, LogOut, Settings } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { FAB } from "@/components/layout/FAB";

interface Estimate {
  id: string;
  client_name: string;
  job_address: string;
  job_type: string;
  category: string | null;
  status: string;
  emergency: boolean;
  created_at: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}

function shortId(id: string): string {
  return `EST-${id.slice(0, 6).toUpperCase()}`;
}

function categoryLabel(job_type: string, category: string | null): string {
  if (job_type === "mold") return "Mold";
  if (job_type === "storm") return "Storm";
  if (!category) return job_type;
  return category.toUpperCase().replace("CAT", "Cat ");
}

function statusColor(status: string): string {
  switch (status) {
    case "approved": return "var(--color-success)";
    case "declined": return "var(--color-error)";
    case "presented": return "var(--color-primary)";
    default: return "var(--color-text-secondary)";
  }
}

export function EstimatesList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: estimates = [], isLoading } = useQuery({
    queryKey: ["estimates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estimates")
        .select("id, client_name, job_address, job_type, category, status, emergency, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Estimate[];
    },
  });

  const filtered = estimates.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.client_name.toLowerCase().includes(q) ||
      e.job_address.toLowerCase().includes(q) ||
      shortId(e.id).toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-1"
        style={{ height: "56px", backgroundColor: "var(--color-header-primary)" }}
      >
        <div style={{ width: "48px" }} />
        <h1
          className="font-semibold"
          style={{ fontSize: "18px", color: "var(--color-text-on-primary)" }}
        >
          {t("estimatesList.title")}
        </h1>
        {/* Menu button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center justify-center"
            style={{
              width: "48px",
              height: "48px",
              color: "var(--color-text-on-primary)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
            aria-label="Menu"
          >
            <Settings size={22} aria-hidden />
          </button>
          {menuOpen && (
            <div
              className="absolute right-2 top-12 z-30 rounded-sm shadow-md"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                minWidth: "180px",
              }}
            >
              {profile?.role === "owner" && (
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); navigate("/admin/prices"); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-left"
                  style={{ color: "var(--color-text-primary)", border: "none", background: "none", cursor: "pointer" }}
                >
                  {t("estimatesList.menuPrices")}
                </button>
              )}
              <button
                type="button"
                onClick={async () => { setMenuOpen(false); await signOut(); navigate("/login"); }}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-left"
                style={{ color: "var(--color-error)", border: "none", background: "none", cursor: "pointer" }}
              >
                <LogOut size={16} aria-hidden />
                {t("estimatesList.signOut")}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Search bar */}
      <div
        className="px-4 py-3 sticky z-10"
        style={{ top: "56px", backgroundColor: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}
      >
        <div
          className="flex items-center gap-2 px-3"
          style={{
            height: "40px",
            backgroundColor: "var(--color-background)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
          }}
        >
          <Search size={16} style={{ color: "var(--color-text-secondary)", flexShrink: 0 }} aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("estimatesList.searchPlaceholder")}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--color-text-primary)" }}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1" style={{ paddingBottom: "72px" }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div
              className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
              style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }}
              aria-label={t("common.loading")}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 px-8 text-center">
            <p className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
              {search ? t("estimatesList.noResults") : t("estimatesList.empty")}
            </p>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {search ? t("estimatesList.noResultsDetail") : t("estimatesList.emptyDetail")}
            </p>
          </div>
        ) : (
          <ul style={{ backgroundColor: "var(--color-surface)" }}>
            {filtered.map((est, i) => (
              <li
                key={est.id}
                style={{
                  borderBottom: i < filtered.length - 1 ? "1px solid var(--color-border)" : "none",
                }}
              >
                <button
                  type="button"
                  onClick={() => navigate(`/estimates/${est.id}/areas`)}
                  className="flex w-full items-center px-4 py-3 text-left gap-3"
                  style={{ background: "none", border: "none", cursor: "pointer", minHeight: "64px" }}
                >
                  {/* Left: details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="font-semibold truncate"
                        style={{ fontSize: "15px", color: "var(--color-text-primary)" }}
                      >
                        {est.client_name}
                        {est.emergency && (
                          <span
                            className="ml-2 text-xs font-medium px-1.5 py-0.5 rounded-sm"
                            style={{ backgroundColor: "#FFF3CD", color: "#92400E" }}
                          >
                            EMRG
                          </span>
                        )}
                      </span>
                      <span
                        className="text-xs shrink-0"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {formatDate(est.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        {shortId(est.id)}
                      </span>
                      <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>·</span>
                      <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        {categoryLabel(est.job_type, est.category)}
                      </span>
                      <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>·</span>
                      <span
                        className="text-xs font-medium"
                        style={{ color: statusColor(est.status) }}
                      >
                        {est.status.charAt(0).toUpperCase() + est.status.slice(1)}
                      </span>
                    </div>
                    <p
                      className="mt-0.5 truncate text-sm"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {est.job_address}
                    </p>
                  </div>
                  {/* Right: chevron */}
                  <ChevronRight
                    size={18}
                    style={{ color: "var(--color-text-secondary)", flexShrink: 0 }}
                    aria-hidden
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* FAB */}
      <FAB onClick={() => navigate("/estimates/new")} label={t("estimatesList.newEstimate")} />
    </div>
  );
}
