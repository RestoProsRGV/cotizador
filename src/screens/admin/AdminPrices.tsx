import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { parseXactimatePriceList, type ParsedPriceItem } from "@/lib/xactimateParser";
import { AppHeader } from "@/components/layout/AppHeader";

interface PriceItem {
  id: string;
  xactimate_code: string;
  name: string;
  unit: string;
  unit_price: number;
  last_updated: string;
}

interface DiffItem extends ParsedPriceItem {
  action: "update" | "new";
  existing?: PriceItem;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AdminPrices() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const qClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [diff, setDiff] = useState<DiffItem[] | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parseSkipped, setParseSkipped] = useState(0);
  const [parsing, setParsing] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  // Fetch existing price items
  const { data: existing = [] } = useQuery({
    queryKey: ["price_items", profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      const { data } = await supabase
        .from("price_items")
        .select("*")
        .eq("tenant_id", profile.tenant_id);
      return (data ?? []) as PriceItem[];
    },
    enabled: !!profile?.tenant_id,
  });

  // Apply mutation
  const applyMutation = useMutation({
    mutationFn: async (items: DiffItem[]) => {
      if (!profile?.tenant_id) throw new Error("No tenant");
      const updates = items.map((item) => ({
        tenant_id: profile.tenant_id,
        xactimate_code: item.xactimate_code,
        name: item.name,
        unit: item.unit,
        unit_price: item.unit_price,
        last_updated: new Date().toISOString(),
      }));
      const { error } = await supabase
        .from("price_items")
        .upsert(updates, { onConflict: "tenant_id,xactimate_code" });
      if (error) throw error;
    },
    onSuccess: () => {
      setApplySuccess(true);
      setDiff(null);
      qClient.invalidateQueries({ queryKey: ["price_items"] });
    },
  });

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    setDiff(null);
    setParseErrors([]);
    setApplySuccess(false);

    try {
      const result = await parseXactimatePriceList(file);
      setParseSkipped(result.skipped);
      setParseErrors(result.errors);

      const existingMap = new Map(existing.map((p) => [p.xactimate_code, p]));
      const diffItems: DiffItem[] = result.items.map((item) => {
        const found = existingMap.get(item.xactimate_code);
        return {
          ...item,
          action: found ? "update" : "new",
          existing: found,
        };
      });
      setDiff(diffItems);
    } catch (err) {
      setParseErrors([String(err)]);
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const updates = diff?.filter((d) => d.action === "update") ?? [];
  const newItems = diff?.filter((d) => d.action === "new") ?? [];

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      <AppHeader
        title={t("admin.pricesTitle")}
        onBack={() => navigate("/estimates")}
      />

      <div className="flex flex-col gap-0 flex-1 pb-8">
        {/* Upload section */}
        <section
          className="flex flex-col gap-4 px-4 py-5"
          style={{ backgroundColor: "var(--color-surface)" }}
        >
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {t("admin.uploadTitle")}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
              {t("admin.uploadDetail")}
            </p>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFile}
            className="hidden"
            id="xlsx-upload"
          />
          <label
            htmlFor="xlsx-upload"
            className="flex items-center justify-center gap-2 font-semibold cursor-pointer"
            style={{
              height: "48px",
              borderRadius: "4px",
              border: "2px dashed var(--color-primary)",
              color: "var(--color-primary)",
              backgroundColor: "var(--color-primary-bg)",
            }}
          >
            <Upload size={18} aria-hidden />
            {parsing ? t("admin.parsing") : t("admin.uploadButton")}
          </label>

          {parseErrors.length > 0 && (
            <div
              className="rounded px-3 py-2"
              style={{ backgroundColor: "var(--color-error-bg)", borderRadius: "4px" }}
            >
              <p className="text-xs font-semibold" style={{ color: "var(--color-error)" }}>
                {parseErrors.length} {t("admin.parseErrors")}
              </p>
              {parseErrors.slice(0, 3).map((e, i) => (
                <p key={i} className="text-xs" style={{ color: "var(--color-error)" }}>{e}</p>
              ))}
            </div>
          )}
        </section>

        {/* Success banner */}
        {applySuccess && (
          <div
            className="flex items-center gap-3 px-4 py-3 mx-4 mt-4 rounded"
            style={{ backgroundColor: "#ECFDF5", border: "1px solid var(--color-success)", borderRadius: "4px" }}
          >
            <CheckCircle size={18} style={{ color: "var(--color-success)" }} aria-hidden />
            <p className="text-sm font-semibold" style={{ color: "#065F46" }}>
              {t("admin.applySuccess")}
            </p>
          </div>
        )}

        {/* Preview diff */}
        {diff && diff.length > 0 && (
          <>
            <div style={{ height: "12px", backgroundColor: "var(--color-background)" }} />
            <section
              className="px-4 py-5"
              style={{ backgroundColor: "var(--color-surface)" }}
            >
              {/* Summary */}
              <div
                className="flex items-start gap-3 p-3 rounded mb-4"
                style={{ backgroundColor: "var(--color-primary-bg)", borderRadius: "4px" }}
              >
                <AlertCircle size={18} style={{ color: "var(--color-primary)", marginTop: "2px" }} aria-hidden />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
                    {t("admin.previewSummary", {
                      updates: updates.length,
                      newItems: newItems.length,
                      skipped: parseSkipped,
                    })}
                  </p>
                </div>
              </div>

              {/* Diff table */}
              <div style={{ overflowX: "auto" }}>
                <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <th className="py-2 text-left font-medium" style={{ color: "var(--color-text-secondary)" }}>Code</th>
                      <th className="py-2 text-left font-medium" style={{ color: "var(--color-text-secondary)" }}>Description</th>
                      <th className="py-2 text-right font-medium" style={{ color: "var(--color-text-secondary)" }}>Old $</th>
                      <th className="py-2 text-right font-medium" style={{ color: "var(--color-text-secondary)" }}>New $</th>
                      <th className="py-2 text-center font-medium" style={{ color: "var(--color-text-secondary)" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diff.slice(0, 50).map((item, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom: "1px solid var(--color-border)",
                          backgroundColor: item.action === "new" ? "#F0FFF4" : "transparent",
                        }}
                      >
                        <td className="py-1.5 font-mono" style={{ color: "var(--color-text-primary)" }}>
                          {item.xactimate_code}
                        </td>
                        <td className="py-1.5 max-w-[160px] truncate" style={{ color: "var(--color-text-primary)" }}>
                          {item.name}
                        </td>
                        <td className="py-1.5 text-right" style={{ color: "var(--color-text-secondary)" }}>
                          {item.existing ? `$${item.existing.unit_price.toFixed(2)}` : "—"}
                        </td>
                        <td className="py-1.5 text-right font-medium" style={{ color: "var(--color-text-primary)" }}>
                          ${item.unit_price.toFixed(2)}
                        </td>
                        <td className="py-1.5 text-center">
                          <span
                            className="px-1.5 py-0.5 rounded-sm text-xs font-medium"
                            style={
                              item.action === "new"
                                ? { backgroundColor: "#D1FAE5", color: "#065F46" }
                                : { backgroundColor: "var(--color-primary-bg)", color: "var(--color-primary)" }
                            }
                          >
                            {item.action === "new" ? t("admin.actionNew") : t("admin.actionUpdate")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {diff.length > 50 && (
                  <p className="mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    + {diff.length - 50} more items
                  </p>
                )}
              </div>

              {/* Apply button */}
              <button
                type="button"
                disabled={applyMutation.isPending}
                onClick={() => applyMutation.mutate(diff)}
                className="mt-4 flex w-full items-center justify-center font-semibold"
                style={{
                  height: "48px",
                  borderRadius: "4px",
                  backgroundColor: applyMutation.isPending ? "var(--color-primary-light)" : "var(--color-primary)",
                  color: "var(--color-text-on-primary)",
                  border: "none",
                  cursor: applyMutation.isPending ? "not-allowed" : "pointer",
                  fontSize: "15px",
                }}
              >
                {applyMutation.isPending ? t("admin.applying") : t("admin.applyButton", { count: diff.length })}
              </button>

              {applyMutation.isError && (
                <p className="mt-2 text-xs" style={{ color: "var(--color-error)" }}>
                  {t("common.error")}
                </p>
              )}
            </section>
          </>
        )}

        {/* Existing prices */}
        {existing.length > 0 && !diff && (
          <>
            <div style={{ height: "12px", backgroundColor: "var(--color-background)" }} />
            <section style={{ backgroundColor: "var(--color-surface)" }}>
              <p
                className="px-4 py-3 text-xs font-medium uppercase tracking-wide"
                style={{ color: "var(--color-text-secondary)", borderBottom: "1px solid var(--color-border)" }}
              >
                {t("admin.currentPrices", { count: existing.length })}
              </p>
              {existing.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-center px-4 py-3"
                  style={{
                    borderBottom: i < existing.length - 1 ? "1px solid var(--color-border)" : "none",
                    minHeight: "52px",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                      {item.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      {item.xactimate_code} · {t("admin.updatedOn", { date: formatDate(item.last_updated) })}
                    </p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                      ${item.unit_price.toFixed(2)}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      /{item.unit}
                    </p>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
