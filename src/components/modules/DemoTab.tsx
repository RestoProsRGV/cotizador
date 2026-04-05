import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "react-i18next";
import { CalcInput } from "@/components/ui/CalcInput";
import { DEMO_SECTIONS, ALL_DEMO_ITEMS, type DemoItemDef } from "@/constants/demoItems";
import { getDemoPreloads } from "@/constants/areaPreloads";
import { getPrice } from "@/constants/prices";

interface LineItem {
  id: string;
  area_id: string | null;
  module: string;
  name: string;
  xactimate_code: string;
  unit: string;
  quantity: number;
  unit_price: number;
  is_manual_override: boolean;
  sort_order: number;
}

interface SuggestionWithQty {
  def: DemoItemDef;
  qty?: number;
}

interface DemoTabProps {
  estimateId: string;
  areaId: string;
  areaName: string;
  areaSf: number;
  areaPerimeter: number;
}

function getDefaultQty(unit: string, sf: number, perimeter: number): number {
  if (unit === "SF") return Math.round(sf) || 1;
  if (unit === "LF") return Math.round(perimeter) || 1;
  return 1;
}

export function DemoTab({ estimateId, areaId, areaName, areaSf, areaPerimeter }: DemoTabProps) {
  const { t } = useTranslation();
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["walls"]));
  const [preloadedCodes, setPreloadedCodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [estimateId, areaId]);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase
      .from("line_items")
      .select("*")
      .eq("estimate_id", estimateId)
      .eq("area_id", areaId)
      .eq("module", "DEM")
      .order("sort_order", { ascending: true });

    const existing = (data as LineItem[]) ?? [];

    if (existing.length === 0 && areaName) {
      const { preload } = getDemoPreloads(areaName);
      if (preload.length > 0) {
        const toInsert = preload.map((code, idx) => {
          const def = ALL_DEMO_ITEMS[code];
          if (!def) return null;
          return {
            estimate_id: estimateId,
            area_id: areaId,
            module: "DEM",
            name: def.name,
            xactimate_code: def.code,
            unit: def.unit,
            quantity: getDefaultQty(def.unit, areaSf, areaPerimeter),
            unit_price: getPrice(def.code),
            is_manual_override: false,
            sort_order: idx,
          };
        }).filter(Boolean);

        if (toInsert.length > 0) {
          const { data: inserted } = await supabase.from("line_items").insert(toInsert).select("*");
          const insertedItems = (inserted as LineItem[]) ?? [];
          setLineItems(insertedItems);
          setPreloadedCodes(new Set(preload));
          setLoading(false);
          return;
        }
      }
    }

    // Restore preloaded codes from existing items that are not manually overridden
    setLineItems(existing);
    setLoading(false);
  }

  function isSelected(code: string): boolean {
    return lineItems.some(li => li.xactimate_code === code);
  }

  function getItem(code: string): LineItem | undefined {
    return lineItems.find(li => li.xactimate_code === code);
  }

  function getSuggestionsWithQty(def: DemoItemDef, parentQty: number): SuggestionWithQty[] {
    if (def.suggestionRules && def.suggestionRules.length > 0) {
      const results: SuggestionWithQty[] = [];
      for (const rule of def.suggestionRules) {
        const sugDef = ALL_DEMO_ITEMS[rule.code];
        if (!sugDef || isSelected(rule.code)) continue;
        const qty = rule.qtyMultiplier !== undefined ? Math.round(parentQty * rule.qtyMultiplier) : undefined;
        results.push({ def: sugDef, qty });
      }
      return results;
    }
    return def.suggestions
      .map(code => ALL_DEMO_ITEMS[code])
      .filter((d): d is DemoItemDef => !!d && !isSelected(d.code))
      .map(d => ({ def: d }));
  }

  async function toggleItem(def: DemoItemDef) {
    if (isSelected(def.code)) {
      const existing = getItem(def.code);
      if (!existing) return;
      await supabase.from("line_items").delete().eq("id", existing.id);
      setLineItems(prev => prev.filter(li => li.id !== existing.id));
    } else {
      await insertItem(def);
    }
  }

  async function insertItem(def: DemoItemDef, overrideQty?: number) {
    const qty = overrideQty ?? getDefaultQty(def.unit, areaSf, areaPerimeter);
    const { data, error } = await supabase
      .from("line_items")
      .insert({
        estimate_id: estimateId,
        area_id: areaId,
        module: "DEM",
        name: def.name,
        xactimate_code: def.code,
        unit: def.unit,
        quantity: qty,
        unit_price: getPrice(def.code),
        is_manual_override: false,
        sort_order: lineItems.length,
      })
      .select("*")
      .single();
    if (!error && data) setLineItems(prev => [...prev, data as LineItem]);
  }

  async function updateQty(itemId: string, qty: number) {
    await supabase.from("line_items").update({ quantity: qty, is_manual_override: true }).eq("id", itemId);
    setLineItems(prev => prev.map(li => li.id === itemId ? { ...li, quantity: qty, is_manual_override: true } : li));
  }

  async function addAll(suggestions: SuggestionWithQty[]) {
    for (const { def, qty } of suggestions) {
      if (!isSelected(def.code)) await insertItem(def, qty);
    }
  }

  function toggleSection(id: string) {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div style={{ padding: "16px" }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: "56px", backgroundColor: "var(--color-border)", marginBottom: "8px", borderRadius: "4px" }} />
        ))}
      </div>
    );
  }

  return (
    <div>
      {DEMO_SECTIONS.map(section => {
        const isExpanded = expandedSections.has(section.id);
        const selectedCount = section.items.filter(it => isSelected(it.code)).length;

        return (
          <div key={section.id}>
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", backgroundColor: "var(--color-background)", border: "none", borderBottom: "1px solid var(--color-border)", cursor: "pointer", minHeight: "48px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>{t(section.labelKey)}</span>
                {selectedCount > 0 && (
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-on-primary)", backgroundColor: "var(--color-primary)", borderRadius: "10px", padding: "1px 7px" }}>{selectedCount}</span>
                )}
              </div>
              {isExpanded ? <ChevronDown size={18} style={{ color: "var(--color-text-secondary)" }} aria-hidden /> : <ChevronRight size={18} style={{ color: "var(--color-text-secondary)" }} aria-hidden />}
            </button>

            {isExpanded && (
              <div style={{ backgroundColor: "var(--color-surface)" }}>
                {section.items.map(def => {
                  const selected = isSelected(def.code);
                  const lineItem = getItem(def.code);
                  const isPreloaded = preloadedCodes.has(def.code) && selected && !lineItem?.is_manual_override;
                  const suggestions = selected
                    ? getSuggestionsWithQty(def, lineItem?.quantity ?? getDefaultQty(def.unit, areaSf, areaPerimeter))
                    : [];

                  return (
                    <div key={def.code}>
                      <div style={{ display: "flex", alignItems: "center", padding: "0 16px", minHeight: "56px", borderBottom: "1px solid var(--color-border)", gap: "12px" }}>
                        <button
                          type="button"
                          onClick={() => toggleItem(def)}
                          aria-pressed={selected}
                          aria-label={def.name}
                          style={{ width: "24px", height: "24px", borderRadius: "50%", border: selected ? "none" : "2px solid var(--color-border)", backgroundColor: selected ? "var(--color-primary)" : "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          {selected && (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                              <path d="M2 7l4 4 6-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>

                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: "14px", color: "var(--color-text-primary)", fontWeight: selected ? 500 : 400 }}>{def.name}</span>
                          <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginLeft: "6px" }}>{def.unit}</span>
                          {isPreloaded && (
                            <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-primary)", backgroundColor: "var(--color-primary-bg)", borderRadius: "3px", padding: "1px 5px", marginLeft: "6px" }}>
                              {t("demo.suggestedBadge")}
                            </span>
                          )}
                        </div>

                        {selected && lineItem && (
                          <CalcInput
                            value={lineItem.quantity}
                            onChange={val => updateQty(lineItem.id, val)}
                            style={{ width: "64px", height: "40px", border: "1px solid var(--color-border)", borderRadius: "4px", textAlign: "center", fontSize: "14px", backgroundColor: "var(--color-surface)", color: "var(--color-text-primary)" }}
                            aria-label={`${def.name} quantity`}
                          />
                        )}
                      </div>

                      {selected && suggestions.length > 0 && (
                        <div style={{ backgroundColor: "var(--color-primary-bg)", borderLeft: "3px solid var(--color-primary)", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", borderBottom: "1px solid var(--color-border)" }}>
                          <span style={{ fontSize: "12px", color: "var(--color-text-primary)" }}>
                            {t("demo.addWith")}: {suggestions.map(s => s.def.name).join(", ")}
                          </span>
                          <button
                            type="button"
                            onClick={() => addAll(suggestions)}
                            style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-primary)", background: "transparent", border: "none", cursor: "pointer", whiteSpace: "nowrap", padding: "4px 8px", minHeight: "32px" }}
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
      })}
    </div>
  );
}
