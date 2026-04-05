import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { DesktopShell } from "@/layouts/DesktopShell";
import { EstimatesTable, shortId, type EstimateRow } from "@/components/desktop/EstimatesTable";

export function DesktopEstimatesList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const { data: estimates = [], isLoading } = useQuery({
    queryKey: ["desktop-estimates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estimates")
        .select("id, client_name, job_address, job_type, category, status, emergency, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EstimateRow[];
    },
  });

  const estimateIds = estimates.map((e) => e.id);

  const { data: totalsData = [] } = useQuery({
    queryKey: ["desktop-estimates-totals", estimateIds],
    enabled: estimateIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("line_items")
        .select("estimate_id, quantity, unit_price")
        .in("estimate_id", estimateIds);
      if (error) throw error;
      return (data ?? []) as { estimate_id: string; quantity: number; unit_price: number }[];
    },
  });

  const totals: Record<string, number> = {};
  for (const row of totalsData) {
    totals[row.estimate_id] = (totals[row.estimate_id] ?? 0) + row.quantity * row.unit_price;
  }

  const filtered = estimates.filter((e) => {
    const q = search.toLowerCase();
    const matchesSearch =
      e.client_name.toLowerCase().includes(q) ||
      e.job_address.toLowerCase().includes(q) ||
      shortId(e.id).toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DesktopShell breadcrumbs={[{ label: "Estimates" }]}>
      <div style={{ padding: "24px 32px" }}>
        {/* Page header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", margin: 0 }}>
            Estimates
          </h1>
          <button
            type="button"
            onClick={() => showToast("Create estimates from the mobile app")}
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
            <Plus size={16} aria-hidden />
            New Estimate
          </button>
        </div>

        {/* Filters */}
        <div
          style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              padding: "0 12px",
              height: "36px",
              width: "280px",
              backgroundColor: "#fff",
            }}
          >
            <Search size={14} style={{ color: "#9ca3af", flexShrink: 0 }} aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, address, or ID..."
              aria-label="Search estimates"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "13px",
                color: "#374151",
                backgroundColor: "transparent",
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            style={{
              height: "36px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              padding: "0 12px",
              fontSize: "13px",
              color: "#374151",
              backgroundColor: "#fff",
              cursor: "pointer",
            }}
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="invoiced">Invoiced</option>
          </select>
        </div>

        <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "8px" }}>
          Showing {filtered.length} of {estimates.length} estimate
          {estimates.length !== 1 ? "s" : ""}
        </p>

        {/* Table card */}
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            overflowX: "auto",
          }}
        >
          {isLoading ? (
            <div style={{ padding: "48px", display: "flex", justifyContent: "center" }}>
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
          ) : (
            <EstimatesTable
              estimates={filtered}
              totals={totals}
              onRowClick={(id) => navigate(`/desktop/estimates/${id}`)}
            />
          )}
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#1e2535",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 500,
            zIndex: 500,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}
    </DesktopShell>
  );
}
