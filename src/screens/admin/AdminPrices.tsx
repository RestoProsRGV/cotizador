import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { parseXactimatePriceList, type ParsedPriceItem } from "@/lib/xactimateParser";
import { AppHeader } from "@/components/layout/AppHeader";
import { HARDCODED_PRICES } from "@/constants/hardcodedPrices";

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

interface Material {
  id: string;
  name: string;
  category: "floor" | "walls" | "ceiling";
  is_common: boolean;
  display_order: number;
  active: boolean;
}

const DEFAULT_MATERIALS = [
  { name: "Carpet", category: "floor", is_common: true, display_order: 1 },
  { name: "Tile", category: "floor", is_common: true, display_order: 2 },
  { name: "Wood", category: "floor", is_common: true, display_order: 3 },
  { name: "Vinyl/LVP", category: "floor", is_common: true, display_order: 4 },
  { name: "Carpet Pad", category: "floor", is_common: false, display_order: 5 },
  { name: "Laminate", category: "floor", is_common: false, display_order: 6 },
  { name: "Hardwood", category: "floor", is_common: false, display_order: 7 },
  { name: "Concrete Slab", category: "floor", is_common: false, display_order: 8 },
  { name: "Drywall", category: "walls", is_common: true, display_order: 1 },
  { name: "Paneling", category: "walls", is_common: true, display_order: 2 },
  { name: "Insulation", category: "walls", is_common: false, display_order: 3 },
  { name: "Plaster", category: "walls", is_common: false, display_order: 4 },
  { name: "Brick/Block", category: "walls", is_common: false, display_order: 5 },
  { name: "Drywall", category: "ceiling", is_common: true, display_order: 1 },
  { name: "Acoustic Tile", category: "ceiling", is_common: true, display_order: 2 },
  { name: "Insulation", category: "ceiling", is_common: false, display_order: 3 },
  { name: "Plaster", category: "ceiling", is_common: false, display_order: 4 },
  { name: "Drop Ceiling", category: "ceiling", is_common: false, display_order: 5 },
] as const;

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

  const [activeTab, setActiveTab] = useState<"prices" | "materials">("prices");
  const [diff, setDiff] = useState<DiffItem[] | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parseSkipped, setParseSkipped] = useState(0);
  const [parsing, setParsing] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  // New material form state
  const [newMatName, setNewMatName] = useState("");
  const [newMatCategory, setNewMatCategory] = useState<"floor" | "walls" | "ceiling">("floor");
  const [newMatIsCommon, setNewMatIsCommon] = useState(true);
  const [addingMat, setAddingMat] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

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

  // Fetch materials
  const { data: materials = [], refetch: refetchMaterials } = useQuery({
    queryKey: ["materials", profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      const { data } = await supabase
        .from("materials")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .order("display_order", { ascending: true });
      return (data ?? []) as Material[];
    },
    enabled: !!profile?.tenant_id,
  });

  // Apply prices mutation
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

  // Load defaults mutation
  const loadDefaultsMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.tenant_id) throw new Error("No tenant");
      const rows = DEFAULT_MATERIALS.map((m) => ({
        tenant_id: profile.tenant_id,
        name: m.name,
        category: m.category,
        is_common: m.is_common,
        display_order: m.display_order,
        active: true,
      }));
      const { error } = await supabase
        .from("materials")
        .upsert(rows, { onConflict: "tenant_id,name,category" });
      if (error) throw error;
    },
    onSuccess: () => {
      refetchMaterials();
    },
  });

  // Toggle is_common mutation
  const toggleCommonMutation = useMutation({
    mutationFn: async ({ id, is_common }: { id: string; is_common: boolean }) => {
      const { error } = await supabase
        .from("materials")
        .update({ is_common })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qClient.invalidateQueries({ queryKey: ["materials"] });
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("materials")
        .update({ active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qClient.invalidateQueries({ queryKey: ["materials"] });
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

  async function handleAddMaterial() {
    if (!newMatName.trim() || !profile?.tenant_id) return;
    setAddingMat(true);
    try {
      const maxOrder = materials
        .filter((m) => m.category === newMatCategory)
        .reduce((max, m) => Math.max(max, m.display_order), 0);
      const { error } = await supabase.from("materials").insert({
        tenant_id: profile.tenant_id,
        name: newMatName.trim(),
        category: newMatCategory,
        is_common: newMatIsCommon,
        display_order: maxOrder + 1,
        active: true,
      });
      if (error) throw error;
      setNewMatName("");
      setNewMatCategory("floor");
      setNewMatIsCommon(true);
      setShowAddForm(false);
      refetchMaterials();
    } catch {
      // silently fail — could add error state
    } finally {
      setAddingMat(false);
    }
  }

  const updates = diff?.filter((d) => d.action === "update") ?? [];
  const newItems = diff?.filter((d) => d.action === "new") ?? [];

  const floorMaterials = materials.filter((m) => m.category === "floor");
  const wallsMaterials = materials.filter((m) => m.category === "walls");
  const ceilingMaterials = materials.filter((m) => m.category === "ceiling");

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    height: "44px",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: isActive ? 600 : 400,
    color: isActive ? "var(--color-primary)" : "var(--color-text-secondary)",
    borderBottom: isActive ? "2px solid var(--color-primary)" : "2px solid transparent",
    transition: "all 150ms ease",
  });

  function renderMaterialRow(mat: Material) {
    return (
      <div
        key={mat.id}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "10px 16px",
          borderBottom: "1px solid var(--color-border)",
          gap: "8px",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "14px", fontWeight: 500, color: mat.active ? "var(--color-text-primary)" : "var(--color-text-secondary)", margin: 0 }}>
            {mat.name}
          </p>
        </div>
        {/* Chip toggle */}
        <button
          type="button"
          onClick={() => toggleCommonMutation.mutate({ id: mat.id, is_common: !mat.is_common })}
          title={t("admin.materialToggleCommon")}
          style={{
            height: "28px",
            paddingLeft: "8px",
            paddingRight: "8px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: 500,
            border: "1px solid",
            cursor: "pointer",
            backgroundColor: mat.is_common ? "var(--color-primary)" : "var(--color-background)",
            color: mat.is_common ? "var(--color-text-on-primary)" : "var(--color-text-secondary)",
            borderColor: mat.is_common ? "var(--color-primary)" : "var(--color-border)",
          }}
        >
          {t("admin.materialIsCommon")}
        </button>
        {/* Active toggle */}
        <button
          type="button"
          onClick={() => toggleActiveMutation.mutate({ id: mat.id, active: !mat.active })}
          style={{
            height: "28px",
            paddingLeft: "8px",
            paddingRight: "8px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: 500,
            border: "1px solid",
            cursor: "pointer",
            backgroundColor: mat.active ? "#ECFDF5" : "var(--color-background)",
            color: mat.active ? "#065F46" : "var(--color-text-secondary)",
            borderColor: mat.active ? "var(--color-success)" : "var(--color-border)",
          }}
        >
          {t("admin.materialActive")}
        </button>
      </div>
    );
  }

  function renderCategorySection(label: string, mats: Material[]) {
    if (mats.length === 0) return null;
    return (
      <div key={label} style={{ marginBottom: "0" }}>
        <p
          style={{
            padding: "8px 16px",
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--color-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            backgroundColor: "var(--color-background)",
            margin: 0,
          }}
        >
          {label}
        </p>
        {mats.map(renderMaterialRow)}
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      <AppHeader
        title={t("admin.pricesTitle")}
        onBack={() => navigate("/estimates")}
      />

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          backgroundColor: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <button type="button" style={tabStyle(activeTab === "prices")} onClick={() => setActiveTab("prices")}>
          {t("admin.pricesTab")}
        </button>
        <button type="button" style={tabStyle(activeTab === "materials")} onClick={() => setActiveTab("materials")}>
          {t("admin.materialsTab")}
        </button>
      </div>

      {/* Hardcoded prices fallback banner */}
      {existing.length === 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", backgroundColor: "#fff8e1", borderBottom: "1px solid #ffe082" }}>
          <AlertCircle size={16} style={{ color: "#f57c00", flexShrink: 0 }} aria-hidden />
          <span style={{ fontSize: "12px", color: "#e65100" }}>
            {t("admin.hardcodedPricesBanner", { count: Object.keys(HARDCODED_PRICES).length })}
          </span>
        </div>
      )}

      {/* Prices tab */}
      {activeTab === "prices" && (
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
      )}

      {/* Materials tab */}
      {activeTab === "materials" && (
        <div style={{ flex: 1, paddingBottom: "32px" }}>
          {materials.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
              <p style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
                {t("admin.materialsEmpty")}
              </p>
              <button
                type="button"
                disabled={loadDefaultsMutation.isPending}
                onClick={() => loadDefaultsMutation.mutate()}
                style={{
                  height: "44px",
                  paddingLeft: "20px",
                  paddingRight: "20px",
                  borderRadius: "4px",
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-text-on-primary)",
                  fontSize: "14px",
                  fontWeight: 600,
                  border: "none",
                  cursor: loadDefaultsMutation.isPending ? "not-allowed" : "pointer",
                  opacity: loadDefaultsMutation.isPending ? 0.7 : 1,
                }}
              >
                {loadDefaultsMutation.isPending ? t("admin.loadingDefaults") : t("admin.loadDefaults")}
              </button>
            </div>
          ) : (
            <>
              <div style={{ backgroundColor: "var(--color-surface)" }}>
                {renderCategorySection(t("admin.materialsFloor"), floorMaterials)}
                {renderCategorySection(t("admin.materialsWalls"), wallsMaterials)}
                {renderCategorySection(t("admin.materialsCeiling"), ceilingMaterials)}
              </div>

              {/* Add material */}
              <div style={{ padding: "16px" }}>
                {!showAddForm ? (
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    style={{
                      width: "100%",
                      height: "44px",
                      borderRadius: "4px",
                      border: "1.5px dashed var(--color-primary)",
                      backgroundColor: "var(--color-primary-bg)",
                      color: "var(--color-primary)",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {t("admin.addMaterial")}
                  </button>
                ) : (
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "var(--color-surface)",
                      borderRadius: "8px",
                      border: "1px solid var(--color-border)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {t("admin.materialName")}
                      </label>
                      <input
                        type="text"
                        value={newMatName}
                        onChange={(e) => setNewMatName(e.target.value)}
                        placeholder={t("admin.materialName")}
                        style={{
                          height: "44px",
                          border: "1px solid var(--color-border)",
                          borderRadius: "4px",
                          padding: "0 12px",
                          fontSize: "14px",
                          backgroundColor: "var(--color-background)",
                          color: "var(--color-text-primary)",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {t("admin.materialCategory")}
                      </label>
                      <select
                        value={newMatCategory}
                        onChange={(e) => setNewMatCategory(e.target.value as "floor" | "walls" | "ceiling")}
                        style={{
                          height: "44px",
                          border: "1px solid var(--color-border)",
                          borderRadius: "4px",
                          padding: "0 12px",
                          fontSize: "14px",
                          backgroundColor: "var(--color-background)",
                          color: "var(--color-text-primary)",
                        }}
                      >
                        <option value="floor">{t("admin.materialsFloor")}</option>
                        <option value="walls">{t("admin.materialsWalls")}</option>
                        <option value="ceiling">{t("admin.materialsCeiling")}</option>
                      </select>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <button
                        type="button"
                        onClick={() => setNewMatIsCommon((v) => !v)}
                        style={{
                          height: "28px",
                          paddingLeft: "10px",
                          paddingRight: "10px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 500,
                          border: "1px solid",
                          cursor: "pointer",
                          backgroundColor: newMatIsCommon ? "var(--color-primary)" : "var(--color-background)",
                          color: newMatIsCommon ? "var(--color-text-on-primary)" : "var(--color-text-secondary)",
                          borderColor: newMatIsCommon ? "var(--color-primary)" : "var(--color-border)",
                        }}
                      >
                        {t("admin.materialIsCommon")}
                      </button>
                      <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                        {t("admin.materialToggleCommon")}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={handleAddMaterial}
                        disabled={addingMat || !newMatName.trim()}
                        style={{
                          flex: 1,
                          height: "44px",
                          borderRadius: "4px",
                          backgroundColor: "var(--color-primary)",
                          color: "var(--color-text-on-primary)",
                          fontSize: "14px",
                          fontWeight: 600,
                          border: "none",
                          cursor: addingMat || !newMatName.trim() ? "not-allowed" : "pointer",
                          opacity: addingMat || !newMatName.trim() ? 0.6 : 1,
                        }}
                      >
                        {t("admin.materialSave")}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowAddForm(false); setNewMatName(""); }}
                        style={{
                          height: "44px",
                          paddingLeft: "16px",
                          paddingRight: "16px",
                          borderRadius: "4px",
                          backgroundColor: "transparent",
                          color: "var(--color-text-secondary)",
                          fontSize: "14px",
                          border: "1px solid var(--color-border)",
                          cursor: "pointer",
                        }}
                      >
                        {t("common.cancel")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
