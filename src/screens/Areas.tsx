import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AppHeader } from "@/components/layout/AppHeader";
import { EstimateNav } from "@/components/layout/EstimateNav";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { FieldInput } from "@/components/ui/FieldInput";
import { MaterialChips, type MaterialsValue } from "@/components/ui/MaterialChips";

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

interface AreaForm {
  name: string;
  lengthFt: string;
  lengthIn: string;
  widthFt: string;
  widthIn: string;
  heightFt: string;
  heightIn: string;
  materials: MaterialsValue;
  materialNote: string;
  showNoteField: boolean;
}

const ROOM_PRESETS = [
  "Bathroom",
  "Kitchen",
  "Bedroom",
  "Laundry Room",
  "Living Room",
  "Hallway",
  "Closet",
  "Garage",
  "Office",
  "Other",
];

function toDecimalFt(ft: string, inches: string): number {
  return (parseFloat(ft) || 0) + (parseFloat(inches) || 0) / 12;
}

function decimalToFtIn(decimal: number): { ft: string; inches: string } {
  const ft = Math.floor(decimal);
  const inches = Math.round((decimal - ft) * 12);
  return { ft: ft > 0 ? String(ft) : "", inches: inches > 0 ? String(inches) : "" };
}

function emptyForm(): AreaForm {
  return {
    name: "",
    lengthFt: "",
    lengthIn: "",
    widthFt: "",
    widthIn: "",
    heightFt: "",
    heightIn: "",
    materials: { floor: [], walls: [], ceiling: [] },
    materialNote: "",
    showNoteField: false,
  };
}

function materialsToArray(m: MaterialsValue): string[] {
  const result: string[] = [];
  m.floor.forEach((v) => result.push(`floor:${v}`));
  m.walls.forEach((v) => result.push(`walls:${v}`));
  m.ceiling.forEach((v) => result.push(`ceiling:${v}`));
  return result;
}

function arrayToMaterials(arr: string[]): MaterialsValue {
  const m: MaterialsValue = { floor: [], walls: [], ceiling: [] };
  (arr || []).forEach((item) => {
    const [group, ...rest] = item.split(":");
    const value = rest.join(":");
    if (group === "floor") m.floor.push(value);
    else if (group === "walls") m.walls.push(value);
    else if (group === "ceiling") m.ceiling.push(value);
  });
  return m;
}


// DimensionPair input component
interface DimPairProps {
  label: string;
  ftValue: string;
  inValue: string;
  ftRef: React.RefObject<HTMLInputElement | null>;
  inRef: React.RefObject<HTMLInputElement | null>;
  onFtChange: (v: string) => void;
  onInChange: (v: string) => void;
}

function DimensionPair({ label, ftValue, inValue, ftRef, inRef, onFtChange, onInChange }: DimPairProps) {
  const inputBase: React.CSSProperties = {
    height: "48px",
    border: "1px solid var(--color-border)",
    borderRadius: "4px",
    fontSize: "16px",
    textAlign: "center",
    backgroundColor: "var(--color-surface)",
    color: "var(--color-text-primary)",
    padding: "0 4px",
    boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0 }}>
      <span style={{ fontSize: "11px", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
        <input
          ref={ftRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={ftValue}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 3);
            onFtChange(v);
            if (v.length >= 2) {
              inRef.current?.focus();
              inRef.current?.select();
            }
          }}
          placeholder="0"
          style={{ ...inputBase, width: "44px" }}
          aria-label={`${label} feet`}
        />
        <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>ft</span>
        <input
          ref={inRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={inValue}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "");
            if (raw === "" || parseInt(raw) <= 11) {
              onInChange(raw);
            }
          }}
          placeholder="0"
          style={{ ...inputBase, width: "36px" }}
          aria-label={`${label} inches`}
        />
        <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>in</span>
      </div>
    </div>
  );
}

export function Areas() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [areas, setAreas] = useState<Area[]>([]);
  const [_moduleCompletions, setModuleCompletions] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [form, setForm] = useState<AreaForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);

  // Dimension input refs for auto-advance
  const lengthFtRef = useRef<HTMLInputElement>(null);
  const lengthInRef = useRef<HTMLInputElement>(null);
  const widthFtRef = useRef<HTMLInputElement>(null);
  const widthInRef = useRef<HTMLInputElement>(null);
  const heightFtRef = useRef<HTMLInputElement>(null);
  const heightInRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAreas();
  }, [id]);

  async function loadAreas() {
    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      setAuthError(true);
      setLoading(false);
      return;
    }
    const [{ data, error: err }, { data: liData }] = await Promise.all([
      supabase
        .from("areas")
        .select("*")
        .eq("estimate_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("line_items")
        .select("area_id,module")
        .eq("estimate_id", id!)
        .not("area_id", "is", null),
    ]);

    if (!err && data) setAreas(data as Area[]);

    // Build completion map: { areaId: { MODULE: count } }
    if (liData) {
      const completions: Record<string, Record<string, number>> = {};
      for (const li of liData as { area_id: string; module: string }[]) {
        if (!li.area_id) continue;
        if (!completions[li.area_id]) completions[li.area_id] = {};
        const areaMap = completions[li.area_id]!;
        areaMap[li.module] = (areaMap[li.module] ?? 0) + 1;
      }
      setModuleCompletions(completions);
    }

    setLoading(false);
  }

  function openAddSheet() {
    setEditingArea(null);
    setForm(emptyForm());
    setError(null);
    setSheetOpen(true);
  }

  function openEditSheet(area: Area) {
    setEditingArea(area);
    const lDec = decimalToFtIn(area.length ?? 0);
    const wDec = decimalToFtIn(area.width ?? 0);
    const hDec = decimalToFtIn(area.height ?? 0);
    setForm({
      name: area.name,
      lengthFt: lDec.ft,
      lengthIn: lDec.inches,
      widthFt: wDec.ft,
      widthIn: wDec.inches,
      heightFt: hDec.ft,
      heightIn: hDec.inches,
      materials: arrayToMaterials(area.materials),
      materialNote: area.material_note ?? "",
      showNoteField: !!area.material_note,
    });
    setError(null);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditingArea(null);
    setForm(emptyForm());
    setError(null);
  }

  function applyPreset(preset: string) {
    setForm((f) => ({ ...f, name: preset }));
  }

  const totalSf = (() => {
    const l = toDecimalFt(form.lengthFt, form.lengthIn);
    const w = toDecimalFt(form.widthFt, form.widthIn);
    return l * w;
  })();

  async function handleSave() {
    if (!form.name.trim()) {
      setError(t("areas.errorNameRequired"));
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      estimate_id: id,
      name: form.name.trim(),
      length: toDecimalFt(form.lengthFt, form.lengthIn),
      width: toDecimalFt(form.widthFt, form.widthIn),
      height: toDecimalFt(form.heightFt, form.heightIn),
      materials: materialsToArray(form.materials),
      material_note: form.materialNote.trim() || null,
    };

    try {
      if (editingArea) {
        const { error: err } = await supabase.from("areas").update(payload).eq("id", editingArea.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from("areas").insert(payload);
        if (err) throw err;
      }
      await loadAreas();
      closeSheet();
    } catch {
      setError(t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingArea) return;
    setDeleting(true);
    try {
      const { error: err } = await supabase.from("areas").delete().eq("id", editingArea.id);
      if (err) throw err;
      await loadAreas();
      closeSheet();
    } catch {
      setError(t("common.error"));
    } finally {
      setDeleting(false);
    }
  }

  if (authError) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "var(--color-background)" }}>
        <AppHeader title={t("areas.title")} onBack={() => navigate(-1)} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", textAlign: "center" }}>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>{t("common.authRequired")}</p>
        </div>
        <EstimateNav />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "var(--color-background)" }}>
      <AppHeader title={t("areas.title")} onBack={() => navigate(-1)} />

      <main style={{ flex: 1, padding: "16px", paddingBottom: "16px" }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{ height: "120px", borderRadius: "8px", backgroundColor: "var(--color-border)", animation: "pulse 1.5s infinite" }}
              />
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {/* Add Area card */}
            <button
              type="button"
              onClick={openAddSheet}
              style={{
                height: "120px",
                borderRadius: "8px",
                backgroundColor: "var(--color-surface)",
                border: "1.5px dashed var(--color-primary)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
              }}
              aria-label={t("areas.addArea")}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "var(--color-primary-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={18} style={{ color: "var(--color-primary)" }} aria-hidden />
              </div>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-primary)" }}>
                {t("areas.addArea")}
              </span>
            </button>

            {/* Room cards */}
            {areas.map((area) => {
              const sf = area.length * area.width;
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => navigate(`/estimates/${id}/areas/${area.id}`)}
                  style={{
                    height: "120px",
                    borderRadius: "8px",
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    padding: "10px",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Top row: name + edit button */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", width: "100%" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", flex: 1, textAlign: "left" }}>
                      {area.name}
                    </span>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); openEditSheet(area); }}
                      aria-label={t("areas.editArea")}
                      style={{ background: "transparent", border: "none", cursor: "pointer", padding: "2px", color: "var(--color-text-secondary)", flexShrink: 0 }}
                    >
                      <Pencil size={14} aria-hidden />
                    </button>
                  </div>

                  {/* Middle: SF */}
                  <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                    {sf > 0 ? `${Math.round(sf)} SF` : t("areas.noDimensions")}
                  </span>

                  {/* Bottom row: material note indicator only */}
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    {area.material_note && (
                      <span
                        title={t("areas.materialNoteTooltip", { note: area.material_note })}
                        style={{ fontSize: "12px", lineHeight: 1 }}
                        aria-label={t("areas.materialNoteTooltip", { note: area.material_note })}
                      >
                        📝
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {!loading && areas.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "24px" }}>
            {t("areas.emptyState")}
          </p>
        )}
      </main>

      <EstimateNav />

      {/* Area form bottom sheet */}
      <BottomSheet open={sheetOpen} onClose={closeSheet} title={editingArea ? t("areas.editArea") : t("areas.addArea")}>
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Room presets */}
          <div>
            <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "8px" }}>
              {t("areas.presets")}
            </span>
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none" }}>
              {ROOM_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  style={{
                    flexShrink: 0,
                    height: "32px",
                    paddingLeft: "12px",
                    paddingRight: "12px",
                    borderRadius: "16px",
                    fontSize: "13px",
                    border: "1px solid var(--color-border)",
                    backgroundColor: form.name === preset ? "var(--color-primary)" : "var(--color-background)",
                    color: form.name === preset ? "var(--color-text-on-primary)" : "var(--color-text-primary)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Name input */}
          <FieldInput
            label={t("areas.roomName")}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder={t("areas.roomNamePlaceholder")}
          />

          {/* Dimensions */}
          <div>
            <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "8px" }}>
              {t("areas.dimensions")}
            </span>
            <div style={{ overflowX: "auto", paddingBottom: "4px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", minWidth: "max-content" }}>
                <DimensionPair
                  label={t("areas.length")}
                  ftValue={form.lengthFt}
                  inValue={form.lengthIn}
                  ftRef={lengthFtRef}
                  inRef={lengthInRef}
                  onFtChange={(v) => setForm((f) => ({ ...f, lengthFt: v }))}
                  onInChange={(v) => setForm((f) => ({ ...f, lengthIn: v }))}
                />
                <span style={{ color: "var(--color-text-secondary)", fontSize: "18px", paddingBottom: "13px" }}>×</span>
                <DimensionPair
                  label={t("areas.width")}
                  ftValue={form.widthFt}
                  inValue={form.widthIn}
                  ftRef={widthFtRef}
                  inRef={widthInRef}
                  onFtChange={(v) => setForm((f) => ({ ...f, widthFt: v }))}
                  onInChange={(v) => setForm((f) => ({ ...f, widthIn: v }))}
                />
                <span style={{ color: "var(--color-text-secondary)", fontSize: "18px", paddingBottom: "13px" }}>×</span>
                <DimensionPair
                  label={t("areas.height")}
                  ftValue={form.heightFt}
                  inValue={form.heightIn}
                  ftRef={heightFtRef}
                  inRef={heightInRef}
                  onFtChange={(v) => setForm((f) => ({ ...f, heightFt: v }))}
                  onInChange={(v) => setForm((f) => ({ ...f, heightIn: v }))}
                />
              </div>
            </div>
            <p style={{ marginTop: "8px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
              {t("areas.totalSf")}: <strong style={{ color: "var(--color-text-primary)" }}>{totalSf > 0 ? totalSf.toFixed(1) : "0"} SF</strong>
            </p>
          </div>

          {/* Materials */}
          <div>
            <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "12px" }}>
              {t("areas.materialsLabel")}
            </span>
            <MaterialChips
              value={form.materials}
              onChange={(m) => setForm((f) => ({ ...f, materials: m }))}
            />

            {/* Material note trigger */}
            {!form.showNoteField ? (
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, showNoteField: true }))}
                style={{
                  marginTop: "12px",
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontSize: "12px",
                  color: "var(--color-text-secondary)",
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                }}
              >
                {t("areas.materialNotePrompt")}
              </button>
            ) : (
              <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {t("areas.materialNoteLabel")}
                </label>
                <textarea
                  value={form.materialNote}
                  onChange={(e) => setForm((f) => ({ ...f, materialNote: e.target.value }))}
                  placeholder={t("areas.materialNotePlaceholder")}
                  rows={3}
                  style={{
                    width: "100%",
                    border: "1px solid var(--color-border)",
                    borderRadius: "4px",
                    padding: "8px 12px",
                    fontSize: "14px",
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                    resize: "vertical",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <p style={{ fontSize: "13px", color: "var(--color-error)", padding: "8px 12px", backgroundColor: "var(--color-error-bg)", borderRadius: "4px" }} role="alert">
              {error}
            </p>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingBottom: "16px" }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                height: "52px",
                borderRadius: "4px",
                backgroundColor: "var(--color-primary)",
                color: "var(--color-text-on-primary)",
                fontSize: "16px",
                fontWeight: 600,
                border: "none",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? t("common.saving") : t("common.save")}
            </button>

            {editingArea && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  height: "48px",
                  borderRadius: "4px",
                  backgroundColor: "transparent",
                  color: "var(--color-error)",
                  fontSize: "15px",
                  fontWeight: 500,
                  border: "1px solid var(--color-error)",
                  cursor: deleting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <Trash2 size={16} aria-hidden />
                {deleting ? t("common.deleting") : t("areas.deleteArea")}
              </button>
            )}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
