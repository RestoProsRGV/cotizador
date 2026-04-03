import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { AppHeader } from "@/components/layout/AppHeader";
import { EstimateNav } from "@/components/layout/EstimateNav";
import { EquipmentTab } from "@/components/modules/EquipmentTab";

interface Area {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: "5px 12px",
    borderRadius: "16px",
    border: active ? "none" : "1px solid var(--color-border)",
    backgroundColor: active ? "var(--color-primary)" : "var(--color-background)",
    color: active ? "var(--color-text-on-primary)" : "var(--color-text-secondary)",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
  };
}

export function Equipment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [areas, setAreas] = useState<Area[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      setAuthError(true);
      setLoading(false);
      return;
    }
    const [{ data: estData }, { data: areaData }] = await Promise.all([
      supabase.from("estimates").select("category").eq("id", id).single(),
      supabase
        .from("areas")
        .select("id,name,length,width,height")
        .eq("estimate_id", id)
        .order("created_at", { ascending: true }),
    ]);
    setCategory((estData as { category: string | null } | null)?.category ?? null);
    setAreas((areaData as Area[]) || []);
    setLoading(false);
  }

  if (authError) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "var(--color-background)" }}>
        <AppHeader title={t("equipment.title")} onBack={() => navigate(-1)} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>{t("common.authRequired")}</p>
        </div>
        <EstimateNav />
      </div>
    );
  }

  const displayAreas = selectedAreaId ? areas.filter((a) => a.id === selectedAreaId) : areas;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "var(--color-background)" }}>
      <AppHeader title={t("equipment.title")} onBack={() => navigate(-1)} />

      {/* Area selector chips */}
      {!loading && areas.length > 0 && (
        <div
          style={{
            padding: "8px 12px",
            backgroundColor: "var(--color-surface)",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            gap: "6px",
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <button type="button" style={chipStyle(selectedAreaId === null)} onClick={() => setSelectedAreaId(null)}>
            {t("common.allAreas")}
          </button>
          {areas.map((area) => (
            <button
              key={area.id}
              type="button"
              style={chipStyle(selectedAreaId === area.id)}
              onClick={() => setSelectedAreaId(area.id)}
            >
              {area.name}
            </button>
          ))}
        </div>
      )}

      <main style={{ flex: 1 }}>
        {loading ? (
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: "120px", backgroundColor: "var(--color-border)", borderRadius: "4px" }} />
            ))}
          </div>
        ) : areas.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center" }}>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>{t("common.noAreas")}</p>
          </div>
        ) : (
          displayAreas.map((area, idx) => (
            <div key={area.id}>
              {/* Area divider/label — only in "All Areas" mode */}
              {selectedAreaId === null && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 16px",
                    backgroundColor: "var(--color-background)",
                    borderTop: idx > 0 ? "2px solid var(--color-border)" : undefined,
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border)" }} />
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--color-text-secondary)",
                      letterSpacing: "0.05em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {area.name.toUpperCase()}
                  </span>
                  <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border)" }} />
                </div>
              )}

              <EquipmentTab
                estimateId={id!}
                areaId={area.id}
                area={{ length: area.length, width: area.width, height: area.height }}
                category={category}
              />
            </div>
          ))
        )}
      </main>

      <EstimateNav />
    </div>
  );
}
