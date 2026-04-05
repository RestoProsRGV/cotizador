import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { DesktopShell } from "@/layouts/DesktopShell";
import { ALL_DEMO_ITEMS } from "@/constants/demoItems";
import { ALL_PREP_ITEMS } from "@/constants/prepItems";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SuggestionRuleRow {
  id: string;
  tenant_id: string;
  trigger_item_code: string;
  suggested_item_code: string;
  qty_formula: "same_qty" | "multiplier" | "fixed";
  qty_multiplier: number | null;
  active: boolean;
}

// ── Item catalog ──────────────────────────────────────────────────────────────

// Combined catalog of all items available as triggers or suggested items
const ALL_ITEMS: Record<string, { name: string; unit: string }> = {
  ...ALL_DEMO_ITEMS,
  ...ALL_PREP_ITEMS,
};

const ALL_ITEM_OPTIONS = Object.entries(ALL_ITEMS)
  .map(([code, item]) => ({ code, name: item.name, unit: item.unit }))
  .sort((a, b) => a.name.localeCompare(b.name));

function getItemName(code: string): string {
  return ALL_ITEMS[code]?.name ?? code;
}

const FORMULA_LABELS: Record<string, string> = {
  same_qty: "Same qty",
  multiplier: "× Multiplier",
  fixed: "Fixed qty",
};

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: ok ? "#065f46" : "#991b1b",
        color: "#fff",
        padding: "10px 18px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 500,
        zIndex: 500,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        whiteSpace: "nowrap",
      }}
    >
      {msg}
    </div>
  );
}

// ── Detail panel — suggestions table for a selected trigger ───────────────────

function DetailPanel({
  triggerCode,
  rules,
  onUpdate,
  onDelete,
  onAdd,
}: {
  triggerCode: string;
  rules: SuggestionRuleRow[];
  onUpdate: (id: string, patch: Partial<SuggestionRuleRow>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAdd: (triggerCode: string) => Promise<void>;
}) {
  const usedCodes = new Set(rules.map((r) => r.suggested_item_code));

  return (
    <div style={{ padding: "24px 32px", overflowY: "auto", height: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "4px",
        }}
      >
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", margin: 0 }}>
          {getItemName(triggerCode)}
        </h2>
      </div>
      <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "20px" }}>
        <code
          style={{
            fontFamily: "monospace",
            fontSize: "12px",
            backgroundColor: "#f3f4f6",
            padding: "2px 6px",
            borderRadius: "4px",
          }}
        >
          {triggerCode}
        </code>
      </p>

      <p
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "8px",
        }}
      >
        Suggests these items:
      </p>

      {/* Table */}
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          overflow: "hidden",
          marginBottom: "12px",
        }}
      >
        {rules.length === 0 ? (
          <p
            style={{
              padding: "32px 20px",
              textAlign: "center",
              fontSize: "13px",
              color: "#9ca3af",
            }}
          >
            No suggestions yet. Add one below.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Suggested Item", "Formula", "Multiplier", "Active", ""].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: "10px 16px",
                      textAlign: "left",
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
              {rules.map((rule) => (
                <SuggestionRow
                  key={rule.id}
                  rule={rule}
                  usedCodes={usedCodes}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button
        type="button"
        onClick={() => onAdd(triggerCode)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          backgroundColor: "transparent",
          border: "1px dashed #d1d5db",
          borderRadius: "6px",
          padding: "8px 16px",
          fontSize: "13px",
          color: "#6b7280",
          cursor: "pointer",
          width: "100%",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "#2196F3";
          (e.currentTarget as HTMLButtonElement).style.color = "#2196F3";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "#d1d5db";
          (e.currentTarget as HTMLButtonElement).style.color = "#6b7280";
        }}
      >
        <Plus size={14} aria-hidden />
        Add Suggestion
      </button>
    </div>
  );
}

// ── Individual editable row ───────────────────────────────────────────────────

function SuggestionRow({
  rule,
  usedCodes,
  onUpdate,
  onDelete,
}: {
  rule: SuggestionRuleRow;
  usedCodes: Set<string>;
  onUpdate: (id: string, patch: Partial<SuggestionRuleRow>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [multiplierDraft, setMultiplierDraft] = useState(
    rule.qty_multiplier !== null ? String(rule.qty_multiplier) : "",
  );

  const selectStyle: React.CSSProperties = {
    border: "1px solid #e5e7eb",
    borderRadius: "4px",
    padding: "4px 8px",
    fontSize: "13px",
    color: "#374151",
    backgroundColor: "#fff",
    cursor: "pointer",
    maxWidth: "100%",
  };

  return (
    <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
      {/* Suggested Item */}
      <td style={{ padding: "10px 16px" }}>
        <select
          value={rule.suggested_item_code}
          onChange={(e) => onUpdate(rule.id, { suggested_item_code: e.target.value })}
          style={{ ...selectStyle, width: "220px" }}
          aria-label="Suggested item"
        >
          {ALL_ITEM_OPTIONS.map((opt) => (
            <option
              key={opt.code}
              value={opt.code}
              disabled={opt.code !== rule.suggested_item_code && usedCodes.has(opt.code)}
            >
              {opt.name}
            </option>
          ))}
        </select>
      </td>

      {/* Formula */}
      <td style={{ padding: "10px 16px" }}>
        <select
          value={rule.qty_formula}
          onChange={(e) => {
            const formula = e.target.value as SuggestionRuleRow["qty_formula"];
            const patch: Partial<SuggestionRuleRow> = { qty_formula: formula };
            if (formula !== "multiplier") patch.qty_multiplier = null;
            onUpdate(rule.id, patch);
          }}
          style={{ ...selectStyle, width: "130px" }}
          aria-label="Quantity formula"
        >
          {Object.entries(FORMULA_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
      </td>

      {/* Multiplier */}
      <td style={{ padding: "10px 16px" }}>
        {rule.qty_formula === "multiplier" ? (
          <input
            type="number"
            value={multiplierDraft}
            onChange={(e) => setMultiplierDraft(e.target.value)}
            onBlur={() => {
              const n = parseFloat(multiplierDraft);
              if (!isNaN(n) && n > 0) {
                onUpdate(rule.id, { qty_multiplier: n });
              }
            }}
            min={0.01}
            step={0.5}
            aria-label="Multiplier value"
            style={{
              width: "72px",
              border: "1px solid #e5e7eb",
              borderRadius: "4px",
              padding: "4px 8px",
              fontSize: "13px",
              color: "#374151",
              textAlign: "center",
            }}
          />
        ) : (
          <span style={{ fontSize: "13px", color: "#d1d5db" }}>—</span>
        )}
      </td>

      {/* Active */}
      <td style={{ padding: "10px 16px" }}>
        <input
          type="checkbox"
          checked={rule.active}
          onChange={(e) => onUpdate(rule.id, { active: e.target.checked })}
          aria-label="Active"
          style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#2196F3" }}
        />
      </td>

      {/* Delete */}
      <td style={{ padding: "10px 16px" }}>
        <button
          type="button"
          onClick={() => onDelete(rule.id)}
          aria-label="Delete suggestion"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#9ca3af",
            display: "flex",
            alignItems: "center",
            padding: "4px",
            borderRadius: "4px",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color = "#ef4444")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color = "#9ca3af")
          }
        >
          <Trash2 size={15} aria-hidden />
        </button>
      </td>
    </tr>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function DesktopSuggestionRules() {
  const { profile } = useAuth();
  const [selectedTriggerCode, setSelectedTriggerCode] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAddTrigger, setShowAddTrigger] = useState(false);
  const [newTriggerCode, setNewTriggerCode] = useState(ALL_ITEM_OPTIONS[0]?.code ?? "");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  const { data: rules = [], refetch } = useQuery({
    queryKey: ["suggestion-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suggestion_rules")
        .select("*")
        .order("trigger_item_code");
      if (error) throw error;
      return (data ?? []) as SuggestionRuleRow[];
    },
  });

  // Group rules by trigger_item_code
  const triggerGroups = new Map<string, SuggestionRuleRow[]>();
  for (const rule of rules) {
    if (!triggerGroups.has(rule.trigger_item_code)) {
      triggerGroups.set(rule.trigger_item_code, []);
    }
    triggerGroups.get(rule.trigger_item_code)!.push(rule);
  }

  const filteredTriggers = [...triggerGroups.keys()].filter((code) =>
    getItemName(code).toLowerCase().includes(search.toLowerCase()),
  );

  const selectedRules = selectedTriggerCode
    ? (triggerGroups.get(selectedTriggerCode) ?? [])
    : [];

  // ── Mutation helpers ────────────────────────────────────────────────────────

  async function handleUpdate(id: string, patch: Partial<SuggestionRuleRow>) {
    const { error } = await supabase
      .from("suggestion_rules")
      .update(patch)
      .eq("id", id);
    if (error) {
      showToast("Error saving", false);
    } else {
      showToast("Saved", true);
      refetch();
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase
      .from("suggestion_rules")
      .delete()
      .eq("id", id);
    if (error) {
      showToast("Error deleting", false);
    } else {
      showToast("Deleted", true);
      refetch();
      // If this was the last rule for the selected trigger, clear selection
      const remaining = selectedRules.filter((r) => r.id !== id);
      if (remaining.length === 0) setSelectedTriggerCode(null);
    }
  }

  async function handleAddSuggestion(triggerCode: string) {
    if (!profile?.tenant_id) return;

    // Pick a default suggested item not already in the list
    const usedCodes = new Set(
      (triggerGroups.get(triggerCode) ?? []).map((r) => r.suggested_item_code),
    );
    const firstAvailable = ALL_ITEM_OPTIONS.find((opt) => !usedCodes.has(opt.code));
    if (!firstAvailable) {
      showToast("All items are already suggested", false);
      return;
    }

    const { error } = await supabase.from("suggestion_rules").insert({
      tenant_id: profile.tenant_id,
      trigger_item_code: triggerCode,
      suggested_item_code: firstAvailable.code,
      qty_formula: "same_qty",
      qty_multiplier: null,
      active: true,
    });

    if (error) {
      showToast("Error adding suggestion", false);
    } else {
      showToast("Suggestion added", true);
      refetch();
    }
  }

  async function handleAddTrigger() {
    if (!profile?.tenant_id || !newTriggerCode) return;

    // Check if trigger already exists
    if (triggerGroups.has(newTriggerCode)) {
      setSelectedTriggerCode(newTriggerCode);
      setShowAddTrigger(false);
      return;
    }

    // Pick a default suggested item (first available)
    const firstAvailable = ALL_ITEM_OPTIONS.find((opt) => opt.code !== newTriggerCode);
    if (!firstAvailable) return;

    const { error } = await supabase.from("suggestion_rules").insert({
      tenant_id: profile.tenant_id,
      trigger_item_code: newTriggerCode,
      suggested_item_code: firstAvailable.code,
      qty_formula: "same_qty",
      qty_multiplier: null,
      active: true,
    });

    if (error) {
      showToast("Error creating rule", false);
    } else {
      showToast("Rule created", true);
      setShowAddTrigger(false);
      setSelectedTriggerCode(newTriggerCode);
      refetch();
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <DesktopShell
      breadcrumbs={[
        { label: "Admin" },
        { label: "Suggestion Rules" },
      ]}
    >
      <div style={{ display: "flex", height: "calc(100vh - 56px)" }}>
        {/* ── Left panel ── */}
        <div
          style={{
            width: "320px",
            minWidth: "320px",
            borderRight: "1px solid #e5e7eb",
            backgroundColor: "#fff",
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid #f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
              Trigger Items
            </span>
            <button
              type="button"
              onClick={() => setShowAddTrigger(true)}
              aria-label="Add rule"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                backgroundColor: "#2196F3",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                padding: "5px 10px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Plus size={13} aria-hidden />
              Add Rule
            </button>
          </div>

          {/* Search */}
          <div style={{ padding: "10px 16px", flexShrink: 0 }}>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter triggers..."
              aria-label="Filter trigger items"
              style={{
                width: "100%",
                border: "1px solid #e5e7eb",
                borderRadius: "5px",
                padding: "6px 10px",
                fontSize: "13px",
                color: "#374151",
                backgroundColor: "#f9fafb",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Add trigger form */}
          {showAddTrigger && (
            <div
              style={{
                margin: "0 16px 10px",
                padding: "12px",
                border: "1px solid #2196F3",
                borderRadius: "6px",
                backgroundColor: "#eff8ff",
                flexShrink: 0,
              }}
            >
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#1e40af", margin: "0 0 8px" }}>
                Select trigger item:
              </p>
              <select
                value={newTriggerCode}
                onChange={(e) => setNewTriggerCode(e.target.value)}
                aria-label="New trigger item"
                style={{
                  width: "100%",
                  border: "1px solid #e5e7eb",
                  borderRadius: "4px",
                  padding: "5px 8px",
                  fontSize: "13px",
                  marginBottom: "8px",
                  boxSizing: "border-box",
                }}
              >
                {ALL_ITEM_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.name}
                  </option>
                ))}
              </select>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  onClick={handleAddTrigger}
                  style={{
                    flex: 1,
                    backgroundColor: "#2196F3",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "6px 0",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTrigger(false)}
                  style={{
                    flex: 1,
                    backgroundColor: "#fff",
                    color: "#6b7280",
                    border: "1px solid #e5e7eb",
                    borderRadius: "4px",
                    padding: "6px 0",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Trigger list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filteredTriggers.length === 0 ? (
              <p
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  fontSize: "13px",
                  color: "#9ca3af",
                }}
              >
                {rules.length === 0
                  ? "No rules yet. Click + Add Rule to create the first one."
                  : "No matches."}
              </p>
            ) : (
              filteredTriggers.map((code) => {
                const groupRules = triggerGroups.get(code) ?? [];
                const isSelected = selectedTriggerCode === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setSelectedTriggerCode(code)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: "none",
                      borderBottom: "1px solid #f3f4f6",
                      padding: "12px 16px",
                      cursor: "pointer",
                      backgroundColor: isSelected ? "#eff8ff" : "transparent",
                      borderLeft: isSelected ? "3px solid #2196F3" : "3px solid transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f9fafb";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? "#1e40af" : "#374151",
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {getItemName(code)}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: isSelected ? "#1e40af" : "#9ca3af",
                        backgroundColor: isSelected ? "#dbeafe" : "#f3f4f6",
                        borderRadius: "10px",
                        padding: "2px 7px",
                        flexShrink: 0,
                        marginLeft: "8px",
                      }}
                    >
                      {groupRules.length}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div style={{ flex: 1, backgroundColor: "#f9fafb", overflowY: "auto" }}>
          {selectedTriggerCode ? (
            <DetailPanel
              triggerCode={selectedTriggerCode}
              rules={selectedRules}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onAdd={handleAddSuggestion}
            />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <p style={{ fontSize: "15px", fontWeight: 600, color: "#374151" }}>
                Select a trigger item
              </p>
              <p style={{ fontSize: "13px", color: "#9ca3af" }}>
                Click an item in the left panel to view and edit its suggestions.
              </p>
            </div>
          )}
        </div>
      </div>

      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </DesktopShell>
  );
}
