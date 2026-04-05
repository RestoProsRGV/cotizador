import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { AppHeader } from "@/components/layout/AppHeader";
import { EstimateNav } from "@/components/layout/EstimateNav";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useEstimatePDF } from "@/hooks/useEstimatePDF";

type EstimateStatus = "draft" | "approved" | "invoiced";

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

const STATUS_BADGE_COLOR = {
  draft:    "gray",
  approved: "green",
  invoiced: "blue",
} as const;

function formatCurrency(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function Total() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { downloadPDF, generating } = useEstimatePDF(id ?? "");

  const [items, setItems] = useState<LineItem[]>([]);
  const [status, setStatus] = useState<EstimateStatus>("draft");
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  // Confirmation sheet: "approve" | "invoice" | null
  const [confirmAction, setConfirmAction] = useState<"approve" | "invoice" | null>(null);
  const [updating, setUpdating] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

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

    const [{ data: estimate }, { data: lineItemData }] = await Promise.all([
      supabase
        .from("estimates")
        .select("status")
        .eq("id", id!)
        .single(),
      supabase
        .from("line_items")
        .select("*")
        .eq("estimate_id", id!)
        .order("sort_order", { ascending: true }),
    ]);

    if (estimate) setStatus(estimate.status as EstimateStatus);
    setItems((lineItemData as LineItem[]) || []);
    setLoading(false);
  }

  async function handleConfirmStatus() {
    if (!confirmAction || !id) return;
    const newStatus: EstimateStatus = confirmAction === "approve" ? "approved" : "invoiced";
    setUpdating(true);
    const { error } = await supabase
      .from("estimates")
      .update({ status: newStatus })
      .eq("id", id);
    setUpdating(false);
    setConfirmAction(null);
    if (error) {
      showToast(t("total.toastError"));
    } else {
      setStatus(newStatus);
      showToast(newStatus === "approved" ? t("total.toastApproved") : t("total.toastInvoiced"));
    }
  }

  // Group by module — WTR items merged into GEN for display
  const byModule: Record<string, LineItem[]> = {};
  for (const item of items) {
    const mod = item.module === "WTR" ? "GEN" : item.module;
    if (!byModule[mod]) byModule[mod] = [];
    byModule[mod].push(item);
  }

  const grandTotal = items.reduce((sum, li) => sum + li.quantity * li.unit_price, 0);

  const statusBadgeColor = STATUS_BADGE_COLOR[status] ?? "gray";
  const statusBadgeLabel = t(`status.${status}`);

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

  const confirmTitle =
    confirmAction === "approve" ? t("total.confirmApproveTitle") : t("total.confirmInvoiceTitle");
  const confirmBody =
    confirmAction === "approve" ? t("total.confirmApproveBody") : t("total.confirmInvoiceBody");
  const confirmAction_ =
    confirmAction === "approve" ? t("total.confirmApproveAction") : t("total.confirmInvoiceAction");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "var(--color-background)",
      }}
    >
      <AppHeader
        title={t("total.title")}
        onBack={() => navigate("/estimates")}
        statusBadge={{ label: statusBadgeLabel, color: statusBadgeColor }}
      />

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: "72px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#1f2937",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 500,
            zIndex: 100,
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}

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

              {/* PDF download */}
              <button
                type="button"
                onClick={downloadPDF}
                disabled={generating}
                style={{
                  height: "48px",
                  borderRadius: "4px",
                  border: "1.5px solid var(--color-border)",
                  backgroundColor: "transparent",
                  color: "var(--color-text-secondary)",
                  fontSize: "15px",
                  fontWeight: 500,
                  cursor: generating ? "not-allowed" : "pointer",
                  opacity: generating ? 0.6 : 1,
                }}
              >
                {generating ? t("total.generatingPDF") : t("total.downloadPDF")}
              </button>

              {/* Status action */}
              {status === "draft" && (
                <button
                  type="button"
                  onClick={() => setConfirmAction("approve")}
                  style={{
                    height: "48px",
                    borderRadius: "4px",
                    border: "1.5px solid var(--color-primary)",
                    backgroundColor: "transparent",
                    color: "var(--color-primary)",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {t("total.markApproved")}
                </button>
              )}
              {status === "approved" && (
                <button
                  type="button"
                  onClick={() => setConfirmAction("invoice")}
                  style={{
                    height: "48px",
                    borderRadius: "4px",
                    border: "1.5px solid #10b981",
                    backgroundColor: "transparent",
                    color: "#10b981",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {t("total.markInvoiced")}
                </button>
              )}
              {status === "invoiced" && (
                <div
                  style={{
                    height: "48px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "4px",
                    backgroundColor: "#d1fae5",
                    color: "#065f46",
                    fontSize: "15px",
                    fontWeight: 600,
                  }}
                  role="status"
                  aria-label={t("status.invoiced")}
                >
                  {t("total.invoicedLabel")}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <EstimateNav />

      {/* Confirmation bottom sheet */}
      <BottomSheet
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={confirmTitle}
      >
        <div style={{ padding: "16px 16px 32px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ fontSize: "15px", color: "var(--color-text-primary)", margin: 0, lineHeight: 1.5 }}>
            {confirmBody}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              type="button"
              onClick={handleConfirmStatus}
              disabled={updating}
              style={{
                height: "52px",
                borderRadius: "4px",
                backgroundColor: "var(--color-primary)",
                color: "var(--color-text-on-primary)",
                fontSize: "16px",
                fontWeight: 600,
                border: "none",
                cursor: updating ? "not-allowed" : "pointer",
                opacity: updating ? 0.7 : 1,
              }}
            >
              {updating ? t("common.saving") : confirmAction_}
            </button>
            <button
              type="button"
              onClick={() => setConfirmAction(null)}
              style={{
                height: "48px",
                borderRadius: "4px",
                border: "1px solid var(--color-border)",
                backgroundColor: "transparent",
                color: "var(--color-text-secondary)",
                fontSize: "15px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
