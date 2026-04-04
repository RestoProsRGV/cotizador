export interface EstimateRow {
  id: string;
  client_name: string;
  job_address: string;
  job_type: string;
  category: string | null;
  status: string;
  emergency: boolean;
  created_at: string;
}

interface EstimatesTableProps {
  estimates: EstimateRow[];
  totals: Record<string, number>;
  onRowClick: (id: string) => void;
}

export function shortId(id: string) {
  return `EST-${id.slice(0, 6).toUpperCase()}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function TypeBadge({ jobType }: { jobType: string }) {
  const label = jobType.charAt(0).toUpperCase() + jobType.slice(1);
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: "12px",
        backgroundColor: "#f3f4f6",
        color: "#374151",
      }}
    >
      {label}
    </span>
  );
}

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null;
  const label = category.replace(/cat_?(\d)/i, "Cat $1").replace(/^cat$/i, "Cat");
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: "12px",
        backgroundColor: "#f3f4f6",
        color: "#374151",
      }}
    >
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  let bg = "#f3f4f6";
  let color = "#374151";
  if (status === "approved") { bg = "#d1fae5"; color = "#065f46"; }
  else if (status === "invoiced") { bg = "#dbeafe"; color = "#1e40af"; }
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: "12px",
        backgroundColor: bg,
        color,
      }}
    >
      {label}
    </span>
  );
}

const COLUMNS = ["Client", "ID", "Type", "Category", "Date", "Total", "Status", ""];

export function EstimatesTable({ estimates, totals, onRowClick }: EstimatesTableProps) {
  if (estimates.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "64px 24px" }}>
        <p style={{ fontSize: "16px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
          No estimates yet. Create your first one.
        </p>
      </div>
    );
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }} role="table">
      <thead>
        <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
          {COLUMNS.map((col) => (
            <th
              key={col}
              style={{
                padding: "10px 16px",
                textAlign: col === "Total" ? "right" : "left",
                fontSize: "11px",
                fontWeight: 600,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                whiteSpace: "nowrap",
              }}
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {estimates.map((est) => (
          <tr
            key={est.id}
            onClick={() => onRowClick(est.id)}
            style={{ cursor: "pointer", borderBottom: "1px solid #f3f4f6" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                "rgba(33,150,243,0.04)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "transparent";
            }}
          >
            {/* Client */}
            <td style={{ padding: "14px 16px" }}>
              <div
                style={{ fontWeight: 600, fontSize: "14px", color: "#2196F3", display: "flex", alignItems: "center", gap: "6px" }}
              >
                {est.client_name}
                {est.emergency && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      backgroundColor: "#FFF3CD",
                      color: "#92400E",
                      borderRadius: "3px",
                      padding: "1px 5px",
                    }}
                  >
                    EMRG
                  </span>
                )}
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                {est.job_address}
              </div>
            </td>
            {/* ID */}
            <td style={{ padding: "14px 16px" }}>
              <span style={{ fontFamily: "monospace", fontSize: "13px", color: "#374151" }}>
                {shortId(est.id)}
              </span>
            </td>
            {/* Type */}
            <td style={{ padding: "14px 16px" }}>
              <TypeBadge jobType={est.job_type} />
            </td>
            {/* Category */}
            <td style={{ padding: "14px 16px" }}>
              <CategoryBadge category={est.category} />
            </td>
            {/* Date */}
            <td
              style={{
                padding: "14px 16px",
                fontSize: "13px",
                color: "#374151",
                whiteSpace: "nowrap",
              }}
            >
              {formatDate(est.created_at)}
            </td>
            {/* Total */}
            <td style={{ padding: "14px 16px", textAlign: "right" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>
                {totals[est.id] != null ? formatCurrency(totals[est.id]) : "—"}
              </span>
            </td>
            {/* Status */}
            <td style={{ padding: "14px 16px" }}>
              <StatusBadge status={est.status} />
            </td>
            {/* Actions */}
            <td style={{ padding: "14px 16px" }}>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                aria-label="More actions"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  fontSize: "20px",
                  lineHeight: 1,
                  padding: "4px 8px",
                  borderRadius: "4px",
                }}
              >
                ···
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
