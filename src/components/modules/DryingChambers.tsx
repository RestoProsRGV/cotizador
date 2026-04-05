/**
 * DryingChambers — per-area drying chamber manager.
 *
 * Renders above the equipment cards in EquipmentTab.
 * Each chamber has a name + L/W/H dimensions. CF = L×W×H.
 * Total dehumidifier count = ceil(sum of all CFs / 100), minimum 1.
 *
 * Calls `onDehumCountChange(count)` when chambers are added/removed/edited
 * so EquipmentTab can override the IICRC dehumidifier quantity.
 * When no chambers exist, calls `onDehumCountChange(null)` to fall back
 * to the IICRC formula.
 */
import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CalcInput } from "@/components/ui/CalcInput";
import { supabase } from "@/lib/supabase";

interface Chamber {
  id: string;
  estimate_id: string;
  area_id: string;
  name: string;
  length_ft: number;
  width_ft: number;
  height_ft: number;
}

interface DryingChambersProps {
  estimateId: string;
  areaId: string;
  /** Called with total dehumidifier count when chambers exist, or null to use IICRC formula */
  onDehumCountChange: (count: number | null) => void;
}

function chamberCF(c: Chamber): number {
  return c.length_ft * c.width_ft * c.height_ft;
}

function totalDehumCount(chambers: Chamber[]): number {
  const totalCF = chambers.reduce((s, c) => s + chamberCF(c), 0);
  return Math.max(1, Math.ceil(totalCF / 100));
}

export function DryingChambers({ estimateId, areaId, onDehumCountChange }: DryingChambersProps) {
  const { t } = useTranslation();
  const [chambers, setChambers] = useState<Chamber[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingName, setAddingName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadChambers();
  }, [estimateId, areaId]);

  async function loadChambers() {
    setLoading(true);
    const { data } = await supabase
      .from("drying_chambers")
      .select("id, estimate_id, area_id, name, length_ft, width_ft, height_ft")
      .eq("estimate_id", estimateId)
      .eq("area_id", areaId)
      .order("created_at", { ascending: true });

    const loaded = (data as Chamber[]) ?? [];
    setChambers(loaded);
    notifyParent(loaded);
    setLoading(false);
  }

  function notifyParent(list: Chamber[]) {
    if (list.length === 0) {
      onDehumCountChange(null);
    } else {
      onDehumCountChange(totalDehumCount(list));
    }
  }

  async function handleAdd() {
    const name = addingName.trim() || `Chamber ${chambers.length + 1}`;
    const { data, error } = await supabase
      .from("drying_chambers")
      .insert({
        estimate_id: estimateId,
        area_id: areaId,
        name,
        length_ft: 0,
        width_ft: 0,
        height_ft: 0,
      })
      .select("id, estimate_id, area_id, name, length_ft, width_ft, height_ft")
      .single();

    if (!error && data) {
      const next = [...chambers, data as Chamber];
      setChambers(next);
      notifyParent(next);
      setAddingName("");
      setShowAddForm(false);
    }
  }

  async function handleDelete(id: string) {
    await supabase.from("drying_chambers").delete().eq("id", id);
    const next = chambers.filter((c) => c.id !== id);
    setChambers(next);
    notifyParent(next);
  }

  async function handleDimChange(
    id: string,
    field: "length_ft" | "width_ft" | "height_ft",
    value: number,
  ) {
    const next = chambers.map((c) => (c.id === id ? { ...c, [field]: value } : c));
    setChambers(next);
    notifyParent(next);

    // Debounce — update DB on blur (called from onBlur handler)
    await supabase
      .from("drying_chambers")
      .update({ [field]: value })
      .eq("id", id);
  }

  async function handleNameChange(id: string, name: string) {
    setChambers((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
    await supabase.from("drying_chambers").update({ name }).eq("id", id);
  }

  if (loading) return null;

  return (
    <div
      style={{
        marginBottom: "12px",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: chambers.length > 0 || showAddForm ? "1px solid var(--color-border)" : "none",
        }}
      >
        <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)" }}>
          {t("dryingChambers.title")}
        </span>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--color-primary)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 8px",
          }}
          aria-label={t("dryingChambers.addChamber")}
        >
          + {t("dryingChambers.addChamber")}
        </button>
      </div>

      {/* No chambers — IICRC fallback note */}
      {chambers.length === 0 && !showAddForm && (
        <p
          style={{
            fontSize: "12px",
            color: "var(--color-text-secondary)",
            padding: "10px 16px",
            margin: 0,
          }}
        >
          {t("dryingChambers.fallbackNote")}
        </p>
      )}

      {/* Chamber cards */}
      {chambers.map((chamber) => {
        const cf = chamberCF(chamber);
        const dehumSuggestion = Math.max(1, Math.ceil(cf / 100));
        return (
          <div
            key={chamber.id}
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--color-border)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {/* Name row */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="text"
                value={chamber.name}
                onChange={(e) =>
                  setChambers((prev) =>
                    prev.map((c) => (c.id === chamber.id ? { ...c, name: e.target.value } : c))
                  )
                }
                onBlur={(e) => handleNameChange(chamber.id, e.target.value)}
                style={{
                  flex: 1,
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--color-text-primary)",
                  border: "none",
                  backgroundColor: "transparent",
                  padding: 0,
                  outline: "none",
                }}
                aria-label={t("dryingChambers.chamberName")}
              />
              <button
                type="button"
                onClick={() => handleDelete(chamber.id)}
                aria-label={t("dryingChambers.deleteChamber")}
                style={{
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-secondary)",
                  flexShrink: 0,
                }}
              >
                <Trash2 size={16} aria-hidden />
              </button>
            </div>

            {/* Dimension inputs */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {(["length_ft", "width_ft", "height_ft"] as const).map((field, i) => (
                <div key={field} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <label
                    style={{ fontSize: "11px", color: "var(--color-text-secondary)", minWidth: "12px" }}
                  >
                    {["L", "W", "H"][i]}
                  </label>
                  <CalcInput
                    value={chamber[field] || 0}
                    onChange={(val) => handleDimChange(chamber.id, field, val)}
                    aria-label={`${chamber.name} ${["length", "width", "height"][i]} ft`}
                    style={{
                      width: "56px",
                      height: "36px",
                      border: "1px solid var(--color-border)",
                      borderRadius: "4px",
                      textAlign: "center",
                      fontSize: "13px",
                      backgroundColor: "var(--color-background)",
                      color: "var(--color-text-primary)",
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>ft</span>
                  {i < 2 && (
                    <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginLeft: "2px" }}>
                      ×
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Calculated values */}
            <div style={{ display: "flex", gap: "16px" }}>
              <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                {Math.round(cf * 10) / 10} CF
              </span>
              <span style={{ fontSize: "12px", color: "var(--color-primary)", fontWeight: 500 }}>
                = {dehumSuggestion} {t("dryingChambers.dehumidifiers")}
              </span>
            </div>
          </div>
        );
      })}

      {/* Add chamber inline form */}
      {showAddForm && (
        <div
          style={{
            padding: "12px 16px",
            display: "flex",
            gap: "8px",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            value={addingName}
            onChange={(e) => setAddingName(e.target.value)}
            placeholder={t("dryingChambers.namePlaceholder")}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") { setShowAddForm(false); setAddingName(""); }
            }}
            style={{
              flex: 1,
              height: "36px",
              border: "1px solid var(--color-border)",
              borderRadius: "4px",
              padding: "0 10px",
              fontSize: "14px",
              backgroundColor: "var(--color-background)",
              color: "var(--color-text-primary)",
            }}
            aria-label={t("dryingChambers.chamberName")}
          />
          <button
            type="button"
            onClick={handleAdd}
            style={{
              height: "36px",
              padding: "0 14px",
              borderRadius: "4px",
              backgroundColor: "var(--color-primary)",
              color: "var(--color-text-on-primary)",
              border: "none",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {t("common.add")}
          </button>
          <button
            type="button"
            onClick={() => { setShowAddForm(false); setAddingName(""); }}
            style={{
              height: "36px",
              padding: "0 10px",
              borderRadius: "4px",
              border: "1px solid var(--color-border)",
              backgroundColor: "transparent",
              color: "var(--color-text-secondary)",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            {t("common.cancel")}
          </button>
        </div>
      )}

      {/* Total dehumidifier summary when multiple chambers */}
      {chambers.length > 1 && (
        <div
          style={{
            padding: "10px 16px",
            backgroundColor: "var(--color-background)",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
            {t("dryingChambers.totalCF", {
              cf: Math.round(chambers.reduce((s, c) => s + chamberCF(c), 0) * 10) / 10,
              count: totalDehumCount(chambers),
            })}
          </span>
        </div>
      )}
    </div>
  );
}
