import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { AppHeader } from "@/components/layout/AppHeader";
import { EstimateNav } from "@/components/layout/EstimateNav";

interface LineItem {
  id: string;
  estimate_id: string;
  module: string;
  name: string;
  xactimate_code: string;
  unit: string;
  quantity: number;
  unit_price: number;
  is_manual_override: boolean;
  sort_order: number;
}

const MODULE_ORDER = ["GEN", "PREP", "DEM", "CLN", "EQP"];
const MODULE_LABEL_KEYS: Record<string, string> = {
  GEN: "total.moduleGeneral",
  PREP: "total.modulePrep",
  DEM: "total.moduleDemo",
  CLN: "total.moduleCleaning",
  EQP: "total.moduleEquipment",
};

function formatCurrency(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function Total() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [items, setItems] = useState<LineItem[]>([]);
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

    const { data } = await supabase
      .from("line_items")
      .select("*")
      .eq("estimate_id", id)
      .order("sort_order", { ascending: true });

    setItems((data as LineItem[]) || []);
    setLoading(false);
  }

  // Group by module — WTR items (drying evaluation) merged into GEN for display
  const byModule: Record<string, LineItem[]> = {};
  for (const item of items) {
    const mod = item.module === "WTR" ? "GEN" : item.module;
    if (!byModule[mod]) byModule[mod] = [];
    byModule[mod].push(item);
  }

  const grandTotal = items.reduce((sum, li) => sum + li.quantity * li.unit_price, 0);

  if (authError) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "var(--color-background)",
        }}
      >
        <AppHeader title={t("total.title")} onBack={() => navigate("/estimates")} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
            {t("common.authRequired")}
          </p>
        </div>
        <EstimateNav />
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "var(--color-background)",
      }}
    >
      <AppHeader title={t("total.title")} onBack={() => navigate("/estimates")} />

      <main style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {loading ? (
          <div
            style={{
              height: "200px",
              backgroundColor: "var(--color-border)",
              borderRadius: "4px",
            }}
          />
        ) : (
          <>
            {/* Summary card */}
            <div
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              {MODULE_ORDER.filter((m) => byModule[m]).map((mod) => {
                const modItems = byModule[mod] ?? [];
                const subtotal = modItems.reduce(
                  (sum, li) => sum + li.quantity * li.unit_price,
                  0
                );
                return (
                  <div
                    key={mod}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 16px",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ fontSize: "14px", color: "var(--color-text-primary)" }}>
                      {t(MODULE_LABEL_KEYS[mod] || mod)}
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        color: "var(--color-text-secondary)",
                        fontFamily: "monospace",
                      }}
                    >
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                );
              })}

              {/* Grand total */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px",
                  borderTop: "2px solid var(--color-border)",
                }}
              >
                <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                  {t("total.grandTotal")}
                </span>
                <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-primary)" }}>
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  height: "52px",
                  borderRadius: "4px",
                  border: "1.5px solid var(--color-primary)",
                  backgroundColor: "transparent",
                  color: "var(--color-primary)",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("total.editEstimate")}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/estimates/${id}/present`)}
                style={{
                  height: "52px",
                  borderRadius: "4px",
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-text-on-primary)",
                  fontSize: "16px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {t("total.presentToClient")}
              </button>
            </div>
          </>
        )}
      </main>

      <EstimateNav />
    </div>
  );
}
