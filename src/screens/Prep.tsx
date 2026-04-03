import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AppHeader } from "@/components/layout/AppHeader";
import { EstimateNav } from "@/components/layout/EstimateNav";

interface Area {
  id: string;
  name: string;
  length: number;
  width: number;
}

interface AreaWithCount extends Area {
  prepCount: number;
}

export function Prep() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [areas, setAreas] = useState<AreaWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    const [{ data: areaData }, { data: prepData }] = await Promise.all([
      supabase
        .from("areas")
        .select("id,name,length,width")
        .eq("estimate_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("line_items")
        .select("area_id")
        .eq("estimate_id", id!)
        .eq("module", "PREP"),
    ]);

    const fetchedAreas = (areaData as Area[]) ?? [];
    const prepItems = prepData ?? [];

    // Count prep items per area
    const countByArea: Record<string, number> = {};
    for (const item of prepItems) {
      if (item.area_id) {
        countByArea[item.area_id] = (countByArea[item.area_id] ?? 0) + 1;
      }
    }

    setAreas(
      fetchedAreas.map(a => ({
        ...a,
        prepCount: countByArea[a.id] ?? 0,
      }))
    );
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "var(--color-background)" }}>
      <AppHeader title={t("prep.title")} onBack={() => navigate(-1)} />

      <main style={{ flex: 1 }}>
        {loading ? (
          <div style={{ padding: "16px" }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: "72px", backgroundColor: "var(--color-border)", marginBottom: "1px", borderRadius: "4px" }} />
            ))}
          </div>
        ) : areas.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 16px", textAlign: "center" }}>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
              {t("prep.noAreas")}
            </p>
          </div>
        ) : (
          <div style={{ backgroundColor: "var(--color-surface)" }}>
            {areas.map(area => {
              const sf = Math.round(area.length * area.width);
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => navigate(`/estimates/${id}/areas/${area.id}`)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    padding: "16px",
                    borderBottom: "1px solid var(--color-border)",
                    background: "transparent",
                    border: "none",
                    borderBottomColor: "var(--color-border)",
                    borderBottomStyle: "solid",
                    borderBottomWidth: "1px",
                    cursor: "pointer",
                    gap: "12px",
                    minHeight: "72px",
                    textAlign: "left",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", display: "block" }}>
                      {area.name}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                      <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                        {sf > 0 ? `${sf} SF` : t("areas.noDimensions")}
                      </span>
                      {area.prepCount > 0 && (
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-on-primary)", backgroundColor: "var(--color-primary)", borderRadius: "10px", padding: "1px 7px" }}>
                          {t("prep.areaItem", { count: area.prepCount })}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={18} style={{ color: "var(--color-text-secondary)", flexShrink: 0 }} aria-hidden />
                </button>
              );
            })}
          </div>
        )}
      </main>

      <EstimateNav />
    </div>
  );
}
