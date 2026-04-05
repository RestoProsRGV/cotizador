import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { AppHeader } from "@/components/layout/AppHeader";
import { EstimateNav } from "@/components/layout/EstimateNav";
import {
  generateGeneralItems,
  classifyJobSize,
  SUPERVISION_FEE,
} from "@/lib/logic/general";
import { getPrice } from "@/constants/prices";

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

interface Estimate {
  id: string;
  emergency: boolean;
}

interface Area {
  id: string;
  length: number;
  width: number;
}

function formatCurrency(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function General() {
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

    const [{ data: estData }, { data: areaData }, { data: genData }] = await Promise.all([
      supabase.from("estimates").select("id,emergency").eq("id", id).single(),
      supabase.from("areas").select("id,length,width").eq("estimate_id", id),
      supabase
        .from("line_items")
        .select("*")
        .eq("estimate_id", id)
        .in("module", ["GEN", "WTR"])
        .order("sort_order", { ascending: true }),
    ]);

    const estimate = estData as Estimate | null;
    const areas = (areaData as Area[]) || [];
    const existingItems = (genData as LineItem[]) || [];

    const totalSf = areas.reduce((sum, a) => sum + a.length * a.width, 0);

    if (existingItems.length === 0 && estimate) {
      const generated = generateGeneralItems(totalSf, estimate.emergency);
      const jobSize = classifyJobSize(totalSf);

      const toInsert = generated.map((g, idx) => {
        let unitPrice = getPrice(g.xactimateCode);
        if (g.xactimateCode === "GEN-SUPV") {
          unitPrice = SUPERVISION_FEE[jobSize];
        }
        return {
          estimate_id: id,
          module: g.module,
          name: g.name,
          xactimate_code: g.xactimateCode,
          unit: g.unit,
          quantity: g.quantity,
          unit_price: unitPrice,
          is_manual_override: false,
          sort_order: idx,
        };
      });

      const { data: inserted } = await supabase
        .from("line_items")
        .insert(toInsert)
        .select("*");

      setItems((inserted as LineItem[]) || []);
    } else {
      setItems(existingItems);
    }

    setLoading(false);
  }

  async function updateQty(itemId: string, qty: number) {
    const { error } = await supabase
      .from("line_items")
      .update({ quantity: qty, is_manual_override: true })
      .eq("id", itemId);
    if (!error) {
      setItems((prev) =>
        prev.map((li) =>
          li.id === itemId ? { ...li, quantity: qty, is_manual_override: true } : li
        )
      );
    }
  }

  const subtotal = items.reduce((sum, li) => sum + li.quantity * li.unit_price, 0);

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
        <AppHeader title={t("general.title")} onBack={() => navigate("/estimates")} />
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
      <AppHeader title={t("general.title")} onBack={() => navigate("/estimates")} />

      <main style={{ flex: 1, paddingBottom: "16px" }}>
        {loading ? (
          <div style={{ padding: "16px" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: "60px",
                  backgroundColor: "var(--color-border)",
                  marginBottom: "1px",
                }}
              />
            ))}
          </div>
        ) : (
          <>
            <div style={{ backgroundColor: "var(--color-surface)" }}>
              {items.map((item) => {
                const isEmergency = item.xactimate_code === "GEN-EMRG";
                return (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--color-border)",
                      gap: "8px",
                      minHeight: "60px",
                      backgroundColor: isEmergency
                        ? "rgba(245, 158, 11, 0.08)"
                        : "var(--color-surface)",
                    }}
                  >
                    {/* AUTO badge */}
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          color: "var(--color-text-on-primary)",
                          backgroundColor: isEmergency
                            ? "var(--color-emergency)"
                            : "var(--color-primary)",
                          borderRadius: "3px",
                          padding: "1px 5px",
                          flexShrink: 0,
                        }}
                      >
                        {isEmergency ? t("general.emergencyBadge") : t("general.autoBadge")}
                      </span>
                      <span style={{ fontSize: "13px", color: "var(--color-text-primary)" }}>
                        {item.name}
                      </span>
                    </div>

                    {/* Qty + price */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        flexShrink: 0,
                      }}
                    >
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateQty(item.id, parseFloat(e.target.value) || 0)}
                        style={{
                          width: "56px",
                          height: "36px",
                          border: "1px solid var(--color-border)",
                          borderRadius: "4px",
                          textAlign: "center",
                          fontSize: "13px",
                          backgroundColor: "var(--color-surface)",
                          color: "var(--color-text-primary)",
                        }}
                        aria-label={`${item.name} quantity`}
                      />
                      <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                        {item.unit}
                      </span>
                      <span
                        style={{
                          fontSize: "13px",
                          color: "var(--color-text-primary)",
                          fontWeight: 500,
                          minWidth: "70px",
                          textAlign: "right",
                        }}
                      >
                        {formatCurrency(item.quantity * item.unit_price)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Subtotal */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px",
                backgroundColor: "var(--color-surface)",
                borderTop: "2px solid var(--color-border)",
                marginTop: "8px",
              }}
            >
              <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                {t("general.subtotal")}
              </span>
              <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-primary)" }}>
                {formatCurrency(subtotal)}
              </span>
            </div>
          </>
        )}
      </main>

      <EstimateNav />
    </div>
  );
}
