import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Pencil } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AppHeader } from "@/components/layout/AppHeader";
import { EstimateNav } from "@/components/layout/EstimateNav";
import { PrepTab } from "@/components/modules/PrepTab";
import { DemoTab } from "@/components/modules/DemoTab";
import { CleaningTab } from "@/components/modules/CleaningTab";
import { EquipmentTab } from "@/components/modules/EquipmentTab";

type TabId = "prep" | "demo" | "cleaning" | "equipment";

const TABS: { id: TabId; labelKey: string }[] = [
  { id: "prep", labelKey: "nav.prep" },
  { id: "demo", labelKey: "nav.demo" },
  { id: "cleaning", labelKey: "nav.cleaning" },
  { id: "equipment", labelKey: "nav.equipment" },
];

interface Area {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
}

interface Estimate {
  id: string;
  category: string | null;
}

export function AreaDetail() {
  const { id, areaId } = useParams<{ id: string; areaId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>("prep");
  const [area, setArea] = useState<Area | null>(null);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id || !areaId) return;
      const [{ data: areaData }, { data: estData }] = await Promise.all([
        supabase.from("areas").select("id,name,length,width,height").eq("id", areaId).single(),
        supabase.from("estimates").select("id,category").eq("id", id).single(),
      ]);
      setArea(areaData as Area | null);
      setEstimate(estData as Estimate | null);
      setLoading(false);
    }
    load();
  }, [id, areaId]);

  if (loading || !area || !id || !areaId) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "var(--color-background)" }}>
        <AppHeader title="..." onBack={() => navigate(`/estimates/${id}/areas`)} />
        <EstimateNav />
      </div>
    );
  }

  const areaSf = area.length * area.width;
  const areaPerimeter = 2 * (area.length + area.width);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "var(--color-background)" }}>
      <AppHeader
        title={t("areaDetail.title", { areaName: area.name })}
        onBack={() => navigate(`/estimates/${id}/areas`)}
        actions={
          <button
            type="button"
            aria-label={t("areas.editArea")}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", color: "var(--color-text-on-primary)", width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Pencil size={18} aria-hidden />
          </button>
        }
      />

      {/* Secondary tab bar */}
      <div
        style={{
          display: "flex",
          backgroundColor: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: "0 0 auto",
              padding: "12px 20px",
              fontSize: "14px",
              fontWeight: 500,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              borderBottom: activeTab === tab.id ? "2px solid var(--color-primary)" : "2px solid transparent",
              color: activeTab === tab.id ? "var(--color-primary)" : "var(--color-text-secondary)",
              whiteSpace: "nowrap",
            }}
            aria-current={activeTab === tab.id ? "page" : undefined}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* SF summary bar */}
      <div style={{ padding: "8px 16px", backgroundColor: "var(--color-background)", borderBottom: "1px solid var(--color-border)" }}>
        <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
          {Math.round(areaSf)} SF · {area.length}×{area.width}×{area.height} ft
        </span>
      </div>

      <main style={{ flex: 1, overflowY: "auto" }}>
        {activeTab === "prep" && (
          <PrepTab
            estimateId={id}
            areaId={areaId}
            areaName={area.name}
            areaSf={areaSf}
            areaPerimeter={areaPerimeter}
          />
        )}
        {activeTab === "demo" && (
          <DemoTab
            estimateId={id}
            areaId={areaId}
            areaName={area.name}
            areaSf={areaSf}
            areaPerimeter={areaPerimeter}
          />
        )}
        {activeTab === "cleaning" && (
          <CleaningTab
            estimateId={id}
            areaId={areaId}
            areaSf={areaSf}
            category={estimate?.category ?? null}
          />
        )}
        {activeTab === "equipment" && (
          <EquipmentTab
            estimateId={id}
            areaId={areaId}
            area={{ length: area.length, width: area.width, height: area.height }}
            category={estimate?.category ?? null}
          />
        )}
      </main>

      <EstimateNav />
    </div>
  );
}
