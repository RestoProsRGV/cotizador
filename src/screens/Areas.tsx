import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
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
}

interface AreaForm {
  name: string;
  length: string;
  width: string;
  height: string;
  materials: MaterialsValue;
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

function emptyForm(): AreaForm {
  return {
    name: "",
    length: "",
    width: "",
    height: "",
    materials: { floor: [], walls: [], ceiling: [] },
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

function getMaterialDots(materials: string[]): { floor: boolean; walls: boolean; ceiling: boolean } {
  return {
    floor: materials.some((m) => m.startsWith("floor:")),
    walls: materials.some((m) => m.startsWith("walls:")),
    ceiling: materials.some((m) => m.startsWith("ceiling:")),
  };
}

export function Areas() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [form, setForm] = useState<AreaForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);

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

    const { data, error: err } = await supabase
      .from("areas")
      .select("*")
      .eq("estimate_id", id)
      .order("created_at", { ascending: true });

    if (!err && data) {
      setAreas(data as Area[]);
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
    setForm({
      name: area.name,
      length: area.length ? String(area.length) : "",
      width: area.width ? String(area.width) : "",
      height: area.height ? String(area.height) : "",
      materials: arrayToMaterials(area.materials),
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
    const l = parseFloat(form.length) || 0;
    const w = parseFloat(form.width) || 0;
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
      length: parseFloat(form.length) || 0,
      width: parseFloat(form.width) || 0,
      height: parseFloat(form.height) || 0,
      materials: materialsToArray(form.materials),
    };

    try {
      if (editingArea) {
        const { error: err } = await supabase
          .from("areas")
          .update(payload)
          .eq("id", editingArea.id);
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
      const { error: err } = await supabase
        .from("areas")
        .delete()
        .eq("id", editingArea.id);
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "var(--color-background)",
        }}
      >
        <AppHeader title={t("areas.title")} onBack={() => navigate(-1)} />
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
            {t("common.authRequired")}
          </p>
        </div>
        <EstimateNav />
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "var(--color-background)",
      }}
    >
      <AppHeader title={t("areas.title")} onBack={() => navigate(-1)} />

      <main style={{ flex: 1, padding: "16px", paddingBottom: "16px" }}>
        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  height: "120px",
                  borderRadius: "8px",
                  backgroundColor: "var(--color-border)",
                  animation: "pulse 1.5s infinite",
                }}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            {/* Add Area card — always first */}
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
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--color-primary)",
                }}
              >
                {t("areas.addArea")}
              </span>
            </button>

            {/* Room cards */}
            {areas.map((area) => {
              const sf = area.length * area.width;
              const dots = getMaterialDots(area.materials);
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => openEditSheet(area)}
                  style={{
                    height: "120px",
                    borderRadius: "8px",
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "flex-end",
                    padding: "10px",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Material dots top-right */}
                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      display: "flex",
                      gap: "4px",
                    }}
                  >
                    {dots.floor && (
                      <span
                        title={t("materials.floor")}
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: "var(--color-primary)",
                        }}
                      />
                    )}
                    {dots.walls && (
                      <span
                        title={t("materials.walls")}
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: "var(--color-success)",
                        }}
                      />
                    )}
                    {dots.ceiling && (
                      <span
                        title={t("materials.ceiling")}
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: "var(--color-warning)",
                        }}
                      />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--color-text-primary)",
                      display: "block",
                    }}
                  >
                    {area.name}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {sf > 0 ? `${Math.round(sf)} SF` : t("areas.noDimensions")}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {!loading && areas.length === 0 && (
          <p
            style={{
              textAlign: "center",
              color: "var(--color-text-secondary)",
              fontSize: "14px",
              marginTop: "24px",
            }}
          >
            {t("areas.emptyState")}
          </p>
        )}
      </main>

      <EstimateNav />

      {/* Area form bottom sheet */}
      <BottomSheet
        open={sheetOpen}
        onClose={closeSheet}
        title={editingArea ? t("areas.editArea") : t("areas.addArea")}
      >
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Room presets */}
          <div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 500,
                color: "var(--color-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block",
                marginBottom: "8px",
              }}
            >
              {t("areas.presets")}
            </span>
            <div
              style={{
                display: "flex",
                gap: "8px",
                overflowX: "auto",
                paddingBottom: "4px",
                scrollbarWidth: "none",
              }}
            >
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
                    backgroundColor:
                      form.name === preset
                        ? "var(--color-primary)"
                        : "var(--color-background)",
                    color:
                      form.name === preset
                        ? "var(--color-text-on-primary)"
                        : "var(--color-text-primary)",
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

          {/* Dimensions row */}
          <div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 500,
                color: "var(--color-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block",
                marginBottom: "8px",
              }}
            >
              {t("areas.dimensions")}
            </span>
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: "11px",
                    color: "var(--color-text-secondary)",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  {t("areas.length")} (ft)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={form.length}
                  onChange={(e) => setForm((f) => ({ ...f, length: e.target.value }))}
                  placeholder="0"
                  style={{
                    width: "100%",
                    height: "48px",
                    border: "1px solid var(--color-border)",
                    borderRadius: "4px",
                    padding: "0 8px",
                    fontSize: "16px",
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>
              <span
                style={{
                  color: "var(--color-text-secondary)",
                  fontSize: "18px",
                  paddingBottom: "12px",
                }}
              >
                ×
              </span>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: "11px",
                    color: "var(--color-text-secondary)",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  {t("areas.width")} (ft)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={form.width}
                  onChange={(e) => setForm((f) => ({ ...f, width: e.target.value }))}
                  placeholder="0"
                  style={{
                    width: "100%",
                    height: "48px",
                    border: "1px solid var(--color-border)",
                    borderRadius: "4px",
                    padding: "0 8px",
                    fontSize: "16px",
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>
              <span
                style={{
                  color: "var(--color-text-secondary)",
                  fontSize: "18px",
                  paddingBottom: "12px",
                }}
              >
                ×
              </span>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: "11px",
                    color: "var(--color-text-secondary)",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  {t("areas.height")} (ft)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={form.height}
                  onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))}
                  placeholder="0"
                  style={{
                    width: "100%",
                    height: "48px",
                    border: "1px solid var(--color-border)",
                    borderRadius: "4px",
                    padding: "0 8px",
                    fontSize: "16px",
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>
            </div>
            {/* Total SF */}
            <p
              style={{
                marginTop: "8px",
                fontSize: "13px",
                color: "var(--color-text-secondary)",
              }}
            >
              {t("areas.totalSf")}: <strong style={{ color: "var(--color-text-primary)" }}>{Math.round(totalSf)} SF</strong>
            </p>
          </div>

          {/* Materials */}
          <div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 500,
                color: "var(--color-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block",
                marginBottom: "12px",
              }}
            >
              {t("areas.materialsLabel")}
            </span>
            <MaterialChips
              value={form.materials}
              onChange={(m) => setForm((f) => ({ ...f, materials: m }))}
            />
          </div>

          {/* Error */}
          {error && (
            <p
              style={{
                fontSize: "13px",
                color: "var(--color-error)",
                padding: "8px 12px",
                backgroundColor: "var(--color-error-bg)",
                borderRadius: "4px",
              }}
              role="alert"
            >
              {error}
            </p>
          )}

          {/* Buttons */}
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
