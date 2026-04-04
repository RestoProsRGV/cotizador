import { X } from "lucide-react";

export interface SlideOverArea {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
}

export interface SlideOverLineItem {
  id: string;
  module: string;
  name: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

interface AreaSlideOverProps {
  area: SlideOverArea | null;
  lineItems: SlideOverLineItem[];
  onClose: () => void;
}

const MODULE_ORDER = ["PREP", "DEM", "CLN", "EQP"];
const MODULE_LABELS: Record<string, string> = {
  PREP: "Prep Work",
  DEM: "Demo",
  CLN: "Cleaning",
  EQP: "Equipment",
};

function formatCurrency(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function AreaSlideOver({ area, lineItems, onClose }: AreaSlideOverProps) {
  if (!area) return null;

  const sf = Math.round(area.length * area.width);

  const byModule: Record<string, SlideOverLineItem[]> = {};
  for (const item of lineItems) {
    if (!byModule[item.module]) byModule[item.module] = [];
    byModule[item.module]!.push(item);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.3)",
          zIndex: 200,
        }}
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-label={`${area.name} details`}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "480px",
          backgroundColor: "#fff",
          zIndex: 201,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", margin: 0 }}>
              {area.name}
            </h2>
            <p style={{ fontSize: "13px", color: "#6b7280", margin: "2px 0 0" }}>
              {sf > 0 ? `${sf} SF` : "No dimensions"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#6b7280",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "6px",
            }}
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            padding: "16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {lineItems.length === 0 ? (
            <p
              style={{
                fontSize: "14px",
                color: "#9ca3af",
                textAlign: "center",
                marginTop: "32px",
              }}
            >
              No line items added yet.
            </p>
          ) : (
            MODULE_ORDER.filter((m) => byModule[m]).map((mod) => (
              <div key={mod}>
                <h3
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    margin: "0 0 8px",
                  }}
                >
                  {MODULE_LABELS[mod]}
                </h3>
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    overflow: "hidden",
                  }}
                >
                  {(byModule[mod] ?? []).map((item, i) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 12px",
                        borderBottom:
                          i < (byModule[mod]?.length ?? 1) - 1 ? "1px solid #f3f4f6" : "none",
                      }}
                    >
                      <span style={{ fontSize: "13px", color: "#374151" }}>{item.name}</span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ fontSize: "12px", color: "#6b7280" }}>
                          {item.quantity} {item.unit}
                        </span>
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#111827",
                            minWidth: "72px",
                            textAlign: "right",
                          }}
                        >
                          {formatCurrency(item.quantity * item.unit_price)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
