import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Eye, MoreHorizontal, FileDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { DesktopShell } from "@/layouts/DesktopShell";
import { AreaSlideOver, type SlideOverArea, type SlideOverLineItem } from "@/components/desktop/AreaSlideOver";
import { shortId } from "@/components/desktop/EstimatesTable";
import { useEstimatePDF } from "@/hooks/useEstimatePDF";

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

interface Area {
  id: string;
  estimate_id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  materials: string[];
  material_note: string | null;
}

interface LineItem {
  id: string;
  estimate_id: string;
  area_id: string | null;
  module: string;
  name: string;
  xactimate_code: string;
  unit: string;
  quantity: number;
  unit_price: number;
  sort_order: number;
}

type Tab = "overview" | "areas" | "general" | "total";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "areas", label: "Areas" },
  { id: "general", label: "General" },
  { id: "total", label: "Total" },
];

const MODULE_ORDER = ["GEN", "PREP", "DEM", "CLN", "EQP"];
const MODULE_LABELS: Record<string, string> = {
  GEN: "General",
  PREP: "Prep Work",
  DEM: "Demo",
  CLN: "Cleaning",
  EQP: "Equipment",
};

function formatCurrency(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function Badge({ label, variant = "gray" }: { label: string; variant?: "gray" | "green" | "blue" }) {
  const styles: Record<string, { bg: string; color: string }> = {
    gray: { bg: "#f3f4f6", color: "#374151" },
    green: { bg: "#d1fae5", color: "#065f46" },
    blue: { bg: "#dbeafe", color: "#1e40af" },
  };
  const { bg, color } = styles[variant] ?? { bg: "#f3f4f6", color: "#374151" };
  return (
    <span
      style={{
        fontSize: "12px",
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: "12px",
        backgroundColor: bg,
        color,
      }}
    >
      {label}
    </span>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid #f3f4f6",
          fontSize: "13px",
          fontWeight: 600,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {title}
      </div>
      <div style={{ padding: "16px 20px" }}>{children}</div>
    </div>
  );
}

/** Overview tab — left: client + job details, right: summary + areas chips */
function OverviewTab({
  estimate,
  areas,
  lineItems,
  onPresentToClient,
}: {
  estimate: Estimate;
  areas: Area[];
  lineItems: LineItem[];
  onPresentToClient: () => void;
}) {
  // Build module subtotals
  const byModule: Record<string, LineItem[]> = {};
  for (const item of lineItems) {
    const mod = item.module === "WTR" ? "GEN" : item.module;
    if (!byModule[mod]) byModule[mod] = [];
    byModule[mod].push(item);
  }
  const grandTotal = lineItems.reduce((s, li) => s + li.quantity * li.unit_price, 0);

  const hasEmergency = lineItems.some((li) => li.xactimate_code === "GEN-EMRG");

  return (
    <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
      {/* Left column — 60% */}
      <div style={{ flex: "0 0 60%", display: "flex", flexDirection: "column", gap: "16px" }}>
        <Card title="Client">
          <p style={{ fontSize: "18px", fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
            {estimate.client_name}
          </p>
          <p style={{ fontSize: "14px", color: "#2196F3", margin: "0 0 8px" }}>
            {estimate.job_address}
          </p>
        </Card>

        <Card title="Job Details">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {[
                ["Loss Type", estimate.job_type.charAt(0).toUpperCase() + estimate.job_type.slice(1)],
                ["Water Category", estimate.category ? estimate.category.replace(/cat_?(\d)/i, "Cat $1") : "—"],
                ["Date Created", formatDate(estimate.created_at)],
                ["ID", shortId(estimate.id)],
                ["Emergency", hasEmergency ? "Yes" : "No"],
              ].map(([label, value]) => (
                <tr key={label} style={{ borderBottom: "1px solid #f9fafb" }}>
                  <td
                    style={{
                      padding: "8px 0",
                      fontSize: "13px",
                      color: "#6b7280",
                      width: "140px",
                    }}
                  >
                    {label}
                  </td>
                  <td style={{ padding: "8px 0", fontSize: "13px", color: "#111827", fontWeight: 500 }}>
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Right column — 40% */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
        <Card title="Summary">
          {MODULE_ORDER.filter((m) => byModule[m]).map((mod) => {
            const subtotal = (byModule[mod] ?? []).reduce(
              (s, li) => s + li.quantity * li.unit_price,
              0
            );
            return (
              <div
                key={mod}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: "1px solid #f9fafb",
                  fontSize: "13px",
                }}
              >
                <span style={{ color: "#6b7280" }}>{MODULE_LABELS[mod]}</span>
                <span style={{ color: "#374151", fontFamily: "monospace" }}>
                  {formatCurrency(subtotal)}
                </span>
              </div>
            );
          })}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 0 4px",
              borderTop: "2px solid #e5e7eb",
              marginTop: "8px",
            }}
          >
            <span style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>Total</span>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#2196F3" }}>
              {formatCurrency(grandTotal)}
            </span>
          </div>
          <button
            type="button"
            onClick={onPresentToClient}
            style={{
              marginTop: "12px",
              width: "100%",
              height: "40px",
              backgroundColor: "#2196F3",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <Eye size={16} aria-hidden />
            Present to Client
          </button>
        </Card>

        <Card title="Areas">
          {areas.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#9ca3af" }}>No areas added yet.</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {areas.map((area) => {
                const sf = Math.round(area.length * area.width);
                return (
                  <span
                    key={area.id}
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      padding: "4px 10px",
                      borderRadius: "12px",
                      backgroundColor: "#f3f4f6",
                      color: "#374151",
                    }}
                  >
                    {area.name}
                    {sf > 0 ? ` · ${sf} SF` : ""}
                  </span>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/** Areas tab — grid of area cards, click opens slide-over */
function AreasTab({
  areas,
  lineItems,
}: {
  areas: Area[];
  lineItems: LineItem[];
}) {
  const [selectedArea, setSelectedArea] = useState<SlideOverArea | null>(null);

  const areaLineItems: SlideOverLineItem[] = selectedArea
    ? lineItems
        .filter((li) => li.area_id === selectedArea.id)
        .map((li) => ({
          id: li.id,
          module: li.module,
          name: li.name,
          quantity: li.quantity,
          unit: li.unit,
          unit_price: li.unit_price,
        }))
    : [];

  return (
    <>
      {areas.length === 0 ? (
        <p style={{ fontSize: "14px", color: "#9ca3af", textAlign: "center", padding: "48px 0" }}>
          No areas added yet.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          {areas.map((area) => {
            const sf = Math.round(area.length * area.width);
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => setSelectedArea(area)}
                style={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "16px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#2196F3";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 0 0 3px rgba(33,150,243,0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                }}
              >
                <p style={{ fontSize: "15px", fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>
                  {area.name}
                </p>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
                  {sf > 0 ? `${sf} SF` : "No dimensions"}
                </p>
                {area.height > 0 && (
                  <p style={{ fontSize: "12px", color: "#9ca3af", margin: "2px 0 0" }}>
                    {area.length.toFixed(1)}′ × {area.width.toFixed(1)}′ × {area.height.toFixed(1)}′
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
      <AreaSlideOver
        area={selectedArea}
        lineItems={areaLineItems}
        onClose={() => setSelectedArea(null)}
      />
    </>
  );
}

/** General tab — read-only table of GEN/WTR items */
function GeneralTab({ lineItems }: { lineItems: LineItem[] }) {
  const genItems = lineItems.filter((li) => li.module === "GEN" || li.module === "WTR");
  const subtotal = genItems.reduce((s, li) => s + li.quantity * li.unit_price, 0);

  if (genItems.length === 0) {
    return (
      <p style={{ fontSize: "14px", color: "#9ca3af", textAlign: "center", padding: "48px 0" }}>
        No general items yet.
      </p>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        overflowX: "auto",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
            {["Item", "Qty", "Unit", "Unit Price", "Subtotal"].map((col, i) => (
              <th
                key={col}
                style={{
                  padding: "10px 16px",
                  textAlign: i >= 1 ? "right" : "left",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {genItems.map((item) => (
            <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={{ padding: "12px 16px", fontSize: "13px", color: "#374151" }}>
                {item.name}
              </td>
              <td style={{ padding: "12px 16px", fontSize: "13px", color: "#374151", textAlign: "right" }}>
                {item.quantity}
              </td>
              <td style={{ padding: "12px 16px", fontSize: "13px", color: "#6b7280", textAlign: "right" }}>
                {item.unit}
              </td>
              <td style={{ padding: "12px 16px", fontSize: "13px", color: "#374151", textAlign: "right", fontFamily: "monospace" }}>
                {formatCurrency(item.unit_price)}
              </td>
              <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600, color: "#111827", textAlign: "right", fontFamily: "monospace" }}>
                {formatCurrency(item.quantity * item.unit_price)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: "2px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
            <td
              colSpan={4}
              style={{ padding: "12px 16px", fontSize: "14px", fontWeight: 700, color: "#374151" }}
            >
              General Total
            </td>
            <td
              style={{
                padding: "12px 16px",
                fontSize: "16px",
                fontWeight: 700,
                color: "#2196F3",
                textAlign: "right",
                fontFamily: "monospace",
              }}
            >
              {formatCurrency(subtotal)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/** Total tab — module breakdown */
function TotalTab({
  lineItems,
  onPresentToClient,
}: {
  lineItems: LineItem[];
  onPresentToClient: () => void;
}) {
  const byModule: Record<string, LineItem[]> = {};
  for (const item of lineItems) {
    const mod = item.module === "WTR" ? "GEN" : item.module;
    if (!byModule[mod]) byModule[mod] = [];
    byModule[mod].push(item);
  }
  const grandTotal = lineItems.reduce((s, li) => s + li.quantity * li.unit_price, 0);

  return (
    <div style={{ maxWidth: "480px" }}>
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          overflow: "hidden",
          marginBottom: "16px",
        }}
      >
        {MODULE_ORDER.filter((m) => byModule[m]).map((mod) => {
          const subtotal = (byModule[mod] ?? []).reduce(
            (s, li) => s + li.quantity * li.unit_price,
            0
          );
          return (
            <div
              key={mod}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 20px",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <span style={{ fontSize: "14px", color: "#374151" }}>{MODULE_LABELS[mod]}</span>
              <span style={{ fontSize: "14px", color: "#6b7280", fontFamily: "monospace" }}>
                {formatCurrency(subtotal)}
              </span>
            </div>
          );
        })}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderTop: "2px solid #e5e7eb",
          }}
        >
          <span style={{ fontSize: "18px", fontWeight: 700, color: "#111827" }}>Total</span>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "#2196F3" }}>
            {formatCurrency(grandTotal)}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onPresentToClient}
        style={{
          width: "100%",
          height: "48px",
          backgroundColor: "#2196F3",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          fontSize: "15px",
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        <Eye size={18} aria-hidden />
        Present to Client
      </button>
    </div>
  );
}

export function DesktopEstimateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<"approve" | "invoice" | "delete" | null>(null);
  const [mutating, setMutating] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);
  const { downloadPDF, generating } = useEstimatePDF(id ?? "");

  // Close overflow menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
    }
    if (overflowOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [overflowOpen]);

  async function handleStatusChange(action: "approve" | "invoice") {
    if (!id) return;
    const newStatus = action === "approve" ? "approved" : "invoiced";
    setMutating(true);
    const { error } = await supabase.from("estimates").update({ status: newStatus }).eq("id", id);
    setMutating(false);
    setConfirmModal(null);
    if (!error && estimate) setEstimate({ ...estimate, status: newStatus });
  }

  async function handleDelete() {
    if (!id) return;
    setMutating(true);
    await supabase.from("estimates").delete().eq("id", id);
    setMutating(false);
    setConfirmModal(null);
    navigate("/desktop/estimates");
  }

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);

      const [{ data: estData }, { data: areaData }, { data: liData }] = await Promise.all([
        supabase
          .from("estimates")
          .select("id, client_name, job_address, job_type, category, status, emergency, created_at")
          .eq("id", id)
          .single(),
        supabase.from("areas").select("*").eq("estimate_id", id).order("created_at"),
        supabase
          .from("line_items")
          .select("*")
          .eq("estimate_id", id)
          .order("sort_order", { ascending: true }),
      ]);

      setEstimate(estData as Estimate | null);
      setAreas((areaData as Area[]) ?? []);
      setLineItems((liData as LineItem[]) ?? []);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading || !estimate) {
    return (
      <DesktopShell
        breadcrumbs={[{ label: "Estimates", href: "/desktop/estimates" }, { label: "..." }]}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "64px" }}>
          <div
            aria-label="Loading"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "3px solid #2196F3",
              borderTopColor: "transparent",
              animation: "spin 0.8s linear infinite",
            }}
          />
        </div>
      </DesktopShell>
    );
  }

  const handlePresentToClient = () => navigate(`/estimates/${id}/present`);

  const categoryLabel = estimate.category
    ? estimate.category.replace(/cat_?(\d)/i, "Cat $1")
    : null;
  const typeLabel = estimate.job_type.charAt(0).toUpperCase() + estimate.job_type.slice(1);
  const statusVariant: "gray" | "green" | "blue" =
    estimate.status === "approved" ? "green" : estimate.status === "invoiced" ? "blue" : "gray";
  const statusLabel = estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1);

  return (
    <DesktopShell
      breadcrumbs={[
        { label: "Estimates", href: "/desktop/estimates" },
        { label: estimate.client_name },
      ]}
    >
      <div style={{ padding: "24px 32px" }}>
        {/* Page header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
              {estimate.client_name}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "13px", color: "#6b7280" }}>{estimate.job_address}</span>
              <span style={{ color: "#d1d5db" }}>·</span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "12px",
                  color: "#6b7280",
                  backgroundColor: "#f3f4f6",
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}
              >
                {shortId(estimate.id)}
              </span>
              {categoryLabel && <Badge label={categoryLabel} />}
              <Badge label={typeLabel} />
              <Badge label={statusLabel} variant={statusVariant} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexShrink: 0, alignItems: "center" }}>
            {/* PDF download */}
            <button
              type="button"
              onClick={downloadPDF}
              disabled={generating}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "transparent",
                color: "#6b7280",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                padding: "8px 14px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: generating ? "not-allowed" : "pointer",
                opacity: generating ? 0.6 : 1,
              }}
            >
              <FileDown size={16} aria-hidden />
              {generating ? "Generating…" : "PDF"}
            </button>

            <button
              type="button"
              onClick={handlePresentToClient}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "#2196F3",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Eye size={16} aria-hidden />
              Present to Client
            </button>

            {/* Overflow menu */}
            <div ref={overflowRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setOverflowOpen((v) => !v)}
                aria-label="More actions"
                style={{
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "transparent",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  cursor: "pointer",
                  color: "#6b7280",
                }}
              >
                <MoreHorizontal size={18} aria-hidden />
              </button>
              {overflowOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 4px)",
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                    minWidth: "200px",
                    zIndex: 50,
                    overflow: "hidden",
                  }}
                >
                  {estimate.status === "draft" && (
                    <button
                      type="button"
                      onClick={() => { setOverflowOpen(false); setConfirmModal("approve"); }}
                      style={{ width: "100%", padding: "12px 16px", textAlign: "left", fontSize: "14px", color: "#10b981", fontWeight: 500, border: "none", background: "none", cursor: "pointer", display: "block" }}
                    >
                      ✓ Mark as Approved
                    </button>
                  )}
                  {estimate.status === "approved" && (
                    <button
                      type="button"
                      onClick={() => { setOverflowOpen(false); setConfirmModal("invoice"); }}
                      style={{ width: "100%", padding: "12px 16px", textAlign: "left", fontSize: "14px", color: "#2196F3", fontWeight: 500, border: "none", background: "none", cursor: "pointer", display: "block" }}
                    >
                      Mark as Invoiced
                    </button>
                  )}
                  {estimate.status === "draft" && (
                    <>
                      <div style={{ height: "1px", backgroundColor: "#f3f4f6", margin: "4px 0" }} />
                      <button
                        type="button"
                        onClick={() => { setOverflowOpen(false); setConfirmModal("delete"); }}
                        style={{ width: "100%", padding: "12px 16px", textAlign: "left", fontSize: "14px", color: "#ef4444", fontWeight: 500, border: "none", background: "none", cursor: "pointer", display: "block" }}
                      >
                        Delete Estimate
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Estimate sections"
          style={{
            display: "flex",
            borderBottom: "1px solid #e5e7eb",
            marginBottom: "24px",
            gap: "0",
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? "#2196F3" : "#6b7280",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid #2196F3" : "2px solid transparent",
                backgroundColor: "transparent",
                cursor: "pointer",
                marginBottom: "-1px",
                transition: "color 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && (
          <OverviewTab
            estimate={estimate}
            areas={areas}
            lineItems={lineItems}
            onPresentToClient={handlePresentToClient}
          />
        )}
        {activeTab === "areas" && (
          <AreasTab areas={areas} lineItems={lineItems} />
        )}
        {activeTab === "general" && (
          <GeneralTab lineItems={lineItems} />
        )}
        {activeTab === "total" && (
          <TotalTab lineItems={lineItems} onPresentToClient={handlePresentToClient} />
        )}
      </div>

      {/* Confirmation modal */}
      {confirmModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => !mutating && setConfirmModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#111827", margin: "0 0 12px" }}>
              {confirmModal === "approve" && "Mark as Approved?"}
              {confirmModal === "invoice" && "Mark as Invoiced?"}
              {confirmModal === "delete" && "Delete Estimate?"}
            </h2>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 20px", lineHeight: 1.6 }}>
              {confirmModal === "approve" && "This means the client has agreed to the scope and price."}
              {confirmModal === "invoice" && "This means payment has been collected or invoiced."}
              {confirmModal === "delete" && "This will permanently delete the estimate and all its data. This cannot be undone."}
            </p>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={mutating}
                style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #e5e7eb", background: "none", fontSize: "14px", color: "#6b7280", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={mutating}
                onClick={() => {
                  if (confirmModal === "delete") handleDelete();
                  else handleStatusChange(confirmModal);
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: confirmModal === "delete" ? "#ef4444" : "#2196F3",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: mutating ? "not-allowed" : "pointer",
                  opacity: mutating ? 0.7 : 1,
                }}
              >
                {mutating ? "…" : confirmModal === "approve" ? "Mark Approved" : confirmModal === "invoice" ? "Mark Invoiced" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DesktopShell>
  );
}
