import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface LineItem {
  id: string;
  module: string;
  name: string;
  xactimate_code: string;
  unit: string;
  quantity: number;
  unit_price: number;
  sort_order: number;
}

interface Estimate {
  id: string;
  client_name: string;
  job_address: string;
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

export function Present() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [items, setItems] = useState<LineItem[]>([]);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    const [{ data: estData }, { data: itemData }] = await Promise.all([
      supabase.from("estimates").select("id,client_name,job_address").eq("id", id).single(),
      supabase
        .from("line_items")
        .select("*")
        .eq("estimate_id", id)
        .order("sort_order", { ascending: true }),
    ]);

    setEstimate(estData as Estimate | null);
    setItems((itemData as LineItem[]) || []);
    setLoading(false);
  }

  // WTR items (e.g. drying evaluation) are merged into GEN for display
  const byModule: Record<string, LineItem[]> = {};
  for (const item of items) {
    const mod = item.module === "WTR" ? "GEN" : item.module;
    if (!byModule[mod]) byModule[mod] = [];
    byModule[mod].push(item);
  }

  const grandTotal = items.reduce((sum, li) => sum + li.quantity * li.unit_price, 0);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "var(--color-surface)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Close button */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "8px",
          position: "sticky",
          top: 0,
          backgroundColor: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t("common.close")}
          style={{
            width: "48px",
            height: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--color-text-secondary)",
          }}
        >
          <X size={22} aria-hidden />
        </button>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "var(--color-text-secondary)" }}>{t("common.loading")}</p>
        </div>
      ) : (
        <div style={{ flex: 1, padding: "24px 16px", display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Company header */}
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                backgroundColor: "var(--color-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  color: "var(--color-text-on-primary)",
                  fontSize: "20px",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                RP
              </span>
            </div>
            <div>
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "var(--color-primary)",
                  margin: 0,
                }}
              >
                RestoPros
              </p>
            </div>
            <div style={{ marginTop: "8px" }}>
              <p
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                {estimate?.client_name}
              </p>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--color-text-secondary)",
                  margin: "4px 0 0",
                }}
              >
                {estimate?.job_address}
              </p>
            </div>
          </div>

          {/* Scope of Work */}
          <div>
            <p
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "var(--color-primary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "16px",
              }}
            >
              {t("present.scopeOfWork")}
            </p>

            {MODULE_ORDER.filter((m) => byModule[m]).map((mod) => (
              <div key={mod} style={{ marginBottom: "20px" }}>
                {/* Module label */}
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    color: "var(--color-text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "8px",
                  }}
                >
                  {t(MODULE_LABEL_KEYS[mod] || mod)}
                </p>

                {(byModule[mod] ?? []).map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: "10px",
                      paddingBottom: "10px",
                      borderTop: idx === 0 ? "1px solid var(--color-border)" : "none",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ fontSize: "14px", color: "var(--color-text-primary)", flex: 1 }}>
                      {item.name}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--color-text-secondary)",
                        margin: "0 12px",
                      }}
                    >
                      {item.quantity} {item.unit}
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {formatCurrency(item.quantity * item.unit_price)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Grand total */}
          <div
            style={{
              borderTop: "3px solid var(--color-text-primary)",
              paddingTop: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--color-text-primary)",
              }}
            >
              {t("total.grandTotal")}
            </span>
            <span
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "var(--color-text-primary)",
              }}
            >
              {formatCurrency(grandTotal)}
            </span>
          </div>

          {/* Footer */}
          <p
            style={{
              fontSize: "12px",
              color: "var(--color-text-secondary)",
              textAlign: "center",
              marginTop: "8px",
            }}
          >
            {t("present.validityNote")}
          </p>

          {/* Approve button */}
          <button
            type="button"
            style={{
              height: "52px",
              width: "100%",
              borderRadius: "4px",
              backgroundColor: "var(--color-primary)",
              color: "var(--color-text-on-primary)",
              fontSize: "16px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              marginBottom: "24px",
            }}
          >
            {t("present.approve")}
          </button>
        </div>
      )}
    </div>
  );
}
