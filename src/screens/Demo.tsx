import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AppHeader } from "@/components/layout/AppHeader";
import { EstimateNav } from "@/components/layout/EstimateNav";
import { DEMO_SECTIONS, ALL_DEMO_ITEMS, type DemoItemDef } from "@/constants/demoItems";

interface SuggestionWithQty {
  def: DemoItemDef;
  qty?: number; // when defined, overrides getDefaultQty for the inserted item
}
import { getPrice } from "@/constants/prices";

interface LineItem {
  id: string;
  estimate_id: string;
  module: string;
  name: string;
  xactimate_code: string;
  unit: string;
  quantity: number;
  unit_price: number;
  is_manual_override: boolean;
  sort_order: number;
}

interface Area {
  id: string;
  length: number;
  width: number;
  height: number;
}

function getDefaultQty(unit: string, totalSf: number, perimeterLf: number): number {
  if (unit === "SF") return Math.round(totalSf) || 1;
  if (unit === "LF") return Math.round(perimeterLf) || 1;
  return 1;
}

export function Demo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["walls"]));

  const totalSf = areas.reduce((sum, a) => sum + a.length * a.width, 0);
  const largestArea = areas.reduce(
    (best, a) => (a.length * a.width > best.length * best.width ? a : best),
    areas[0] || { length: 0, width: 0, height: 0 }
  );
  const perimeterLf = largestArea
    ? 2 * (largestArea.length + largestArea.width)
    : 0;

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      setAuthError(true);
      setLoading(false);
      return;
    }

    const [{ data: areaData }, { data: itemData }] = await Promise.all([
      supabase.from("areas").select("id,length,width,height").eq("estimate_id", id),
      supabase
        .from("line_items")
        .select("*")
        .eq("estimate_id", id)
        .eq("module", "DEM")
        .order("sort_order", { ascending: true }),
    ]);

    if (areaData) setAreas(areaData as Area[]);
    if (itemData) setLineItems(itemData as LineItem[]);
    setLoading(false);
  }

  function isSelected(code: string): boolean {
    return lineItems.some((li) => li.xactimate_code === code);
  }

  function getItem(code: string): LineItem | undefined {
    return lineItems.find((li) => li.xactimate_code === code);
  }

  /**
   * Returns suggestions for a demo item, with derived quantities where applicable.
   * Items with suggestionRules get qty = parentQty × multiplier (e.g. flood cut insulation).
   * Items with plain suggestions[] get qty from getDefaultQty() as usual.
   */
  function getSuggestionsWithQty(def: DemoItemDef, parentQty: number): SuggestionWithQty[] {
    if (def.suggestionRules && def.suggestionRules.length > 0) {
      const results: SuggestionWithQty[] = [];
      for (const rule of def.suggestionRules) {
        const sugDef = ALL_DEMO_ITEMS[rule.code];
        if (!sugDef || isSelected(rule.code)) continue;
        const qty =
          rule.qtyMultiplier !== undefined
            ? Math.round(parentQty * rule.qtyMultiplier)
            : undefined;
        results.push({ def: sugDef, qty });
      }
      return results;
    }
    // Fallback: plain suggestions array, no qty override
    return def.suggestions
      .map((code) => ALL_DEMO_ITEMS[code])
      .filter((d): d is DemoItemDef => !!d && !isSelected(d.code))
      .map((d) => ({ def: d }));
  }

  async function toggleItem(def: DemoItemDef) {
    if (isSelected(def.code)) {
      // Delete
      const existing = getItem(def.code);
      if (!existing) return;
      const { error } = await supabase
        .from("line_items")
        .delete()
        .eq("id", existing.id);
      if (!error) {
        setLineItems((prev) => prev.filter((li) => li.id !== existing.id));
      }
    } else {
      // Insert
      await insertItem(def);
    }
  }

  async function insertItem(def: DemoItemDef, overrideQty?: number) {
    const qty = overrideQty ?? getDefaultQty(def.unit, totalSf, perimeterLf);
    const price = getPrice(def.code);
    const { data, error } = await supabase
      .from("line_items")
      .insert({
        estimate_id: id,
        module: "DEM",
        name: def.name,
        xactimate_code: def.code,
        unit: def.unit,
        quantity: qty,
        unit_price: price,
        is_manual_override: false,
        sort_order: lineItems.length,
      })
      .select("*")
      .single();
    if (!error && data) {
      setLineItems((prev) => [...prev, data as LineItem]);
    }
  }

  async function updateQty(itemId: string, qty: number) {
    const { error } = await supabase
      .from("line_items")
      .update({ quantity: qty, is_manual_override: true })
      .eq("id", itemId);
    if (!error) {
      setLineItems((prev) =>
        prev.map((li) =>
          li.id === itemId ? { ...li, quantity: qty, is_manual_override: true } : li
        )
      );
    }
  }

  async function addAll(suggestions: SuggestionWithQty[]) {
    for (const { def, qty } of suggestions) {
      if (!isSelected(def.code)) {
        await insertItem(def, qty);
      }
    }
  }

  function toggleSection(sectionId: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
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
        <AppHeader title={t("demo.title")} onBack={() => navigate(-1)} />
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
      <AppHeader title={t("demo.title")} onBack={() => navigate(-1)} />

      <main style={{ flex: 1 }}>
        {loading ? (
          <div style={{ padding: "16px" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: "56px",
                  backgroundColor: "var(--color-border)",
                  marginBottom: "8px",
                  borderRadius: "4px",
                }}
              />
            ))}
          </div>
        ) : (
          DEMO_SECTIONS.map((section) => {
            const isExpanded = expandedSections.has(section.id);
            const selectedCount = section.items.filter((it) => isSelected(it.code)).length;

            return (
              <div key={section.id}>
                {/* Section header */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    backgroundColor: "var(--color-background)",
                    border: "none",
                    borderBottom: "1px solid var(--color-border)",
                    cursor: "pointer",
                    minHeight: "48px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {t(section.labelKey)}
                    </span>
                    {selectedCount > 0 && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "var(--color-text-on-primary)",
                          backgroundColor: "var(--color-primary)",
                          borderRadius: "10px",
                          padding: "1px 7px",
                          minWidth: "20px",
                          textAlign: "center",
                        }}
                      >
                        {selectedCount}
                      </span>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronDown size={18} style={{ color: "var(--color-text-secondary)" }} aria-hidden />
                  ) : (
                    <ChevronRight size={18} style={{ color: "var(--color-text-secondary)" }} aria-hidden />
                  )}
                </button>

                {/* Section items */}
                {isExpanded && (
                  <div
                    style={{
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    {section.items.map((def) => {
                      const selected = isSelected(def.code);
                      const lineItem = getItem(def.code);
                      const suggestions = selected
                        ? getSuggestionsWithQty(def, lineItem?.quantity ?? getDefaultQty(def.unit, totalSf, perimeterLf))
                        : [];

                      return (
                        <div key={def.code}>
                          {/* Item row */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              padding: "0 16px",
                              minHeight: "56px",
                              borderBottom: "1px solid var(--color-border)",
                              gap: "12px",
                            }}
                          >
                            {/* Checkbox indicator */}
                            <button
                              type="button"
                              onClick={() => toggleItem(def)}
                              aria-pressed={selected}
                              aria-label={def.name}
                              style={{
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                border: selected
                                  ? "none"
                                  : "2px solid var(--color-border)",
                                backgroundColor: selected
                                  ? "var(--color-primary)"
                                  : "transparent",
                                cursor: "pointer",
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {selected && (
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 14 14"
                                  fill="none"
                                  aria-hidden
                                >
                                  <path
                                    d="M2 7l4 4 6-7"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </button>

                            {/* Name + unit */}
                            <div style={{ flex: 1 }}>
                              <span
                                style={{
                                  fontSize: "14px",
                                  color: "var(--color-text-primary)",
                                  fontWeight: selected ? 500 : 400,
                                }}
                              >
                                {def.name}
                              </span>
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: "var(--color-text-secondary)",
                                  marginLeft: "6px",
                                }}
                              >
                                {def.unit}
                              </span>
                            </div>

                            {/* Qty input when selected */}
                            {selected && lineItem && (
                              <input
                                type="number"
                                inputMode="decimal"
                                min="0"
                                value={lineItem.quantity}
                                onChange={(e) =>
                                  updateQty(lineItem.id, parseFloat(e.target.value) || 0)
                                }
                                style={{
                                  width: "64px",
                                  height: "40px",
                                  border: "1px solid var(--color-border)",
                                  borderRadius: "4px",
                                  textAlign: "center",
                                  fontSize: "14px",
                                  backgroundColor: "var(--color-surface)",
                                  color: "var(--color-text-primary)",
                                }}
                                aria-label={`${def.name} quantity`}
                              />
                            )}
                          </div>

                          {/* Suggestions banner */}
                          {selected && suggestions.length > 0 && (
                            <div
                              style={{
                                backgroundColor: "var(--color-primary-bg)",
                                borderLeft: "3px solid var(--color-primary)",
                                padding: "10px 16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "8px",
                                borderBottom: "1px solid var(--color-border)",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: "var(--color-text-primary)",
                                }}
                              >
                                {t("demo.addWith")}:{" "}
                                {suggestions.map((s) => s.def.name).join(", ")}
                              </span>
                              <button
                                type="button"
                                onClick={() => addAll(suggestions)}
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  color: "var(--color-primary)",
                                  background: "transparent",
                                  border: "none",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                  padding: "4px 8px",
                                  minHeight: "32px",
                                }}
                              >
                                {t("demo.addAll")}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>

      <EstimateNav />
    </div>
  );
}
