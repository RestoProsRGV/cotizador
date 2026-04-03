import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { generateCleaningItems, type WaterCategory } from "@/lib/logic/cleaning";
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

interface AddItemForm {
  name: string;
  unit: string;
  quantity: string;
  price: string;
}

interface CleaningTabProps {
  estimateId: string;
  areaId: string;
  areaSf: number;
  category: string | null;
}

const emptyAddForm = (): AddItemForm => ({
  name: "",
  unit: "SF",
  quantity: "1",
  price: "0",
});

function formatCurrency(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function CleaningTab({ estimateId, areaId, areaSf, category }: CleaningTabProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<AddItemForm>(emptyAddForm());
  const [savingAdd, setSavingAdd] = useState(false);

  useEffect(() => {
    loadData();
  }, [estimateId, areaId]);

  async function loadData() {
    setLoading(true);

    // Check for existing DEM items with same area_id to set hasDemo
    const [{ data: demData }, { data: clnData }] = await Promise.all([
      supabase
        .from("line_items")
        .select("id")
        .eq("estimate_id", estimateId)
        .eq("area_id", areaId)
        .eq("module", "DEM"),
      supabase
        .from("line_items")
        .select("*")
        .eq("estimate_id", estimateId)
        .eq("area_id", areaId)
        .eq("module", "CLN")
        .order("sort_order", { ascending: true }),
    ]);

    const hasDemo = (demData?.length ?? 0) > 0;
    const existingItems = (clnData as LineItem[]) ?? [];

    if (existingItems.length === 0 && category) {
      // Auto-generate cleaning items for this area
      const cat = category as WaterCategory;
      const generated = generateCleaningItems(cat, areaSf, hasDemo);

      const toInsert = generated.map((g, idx) => ({
        estimate_id: estimateId,
        area_id: areaId,
        module: "CLN",
        name: g.name,
        xactimate_code: g.xactimateCode,
        unit: g.unit,
        quantity: g.quantity,
        unit_price: getPrice(g.xactimateCode),
        is_manual_override: false,
        sort_order: idx,
      }));

      // Note: Containment barrier belongs in Prep Work (PREP-CONTAIN-BARRIER), not Cleaning.

      if (toInsert.length > 0) {
        const { data: inserted } = await supabase
          .from("line_items")
          .insert(toInsert)
          .select("*");
        if (inserted) {
          setItems(inserted as LineItem[]);
          setLoading(false);
          return;
        }
      }
    }

    setItems(existingItems);
    setLoading(false);
  }

  async function updateQty(itemId: string, qty: number) {
    const { error } = await supabase
      .from("line_items")
      .update({ quantity: qty, is_manual_override: true })
      .eq("id", itemId);
    if (!error) {
      setItems(prev => prev.map(li => li.id === itemId ? { ...li, quantity: qty, is_manual_override: true } : li));
    }
  }

  async function deleteItem(itemId: string) {
    const { error } = await supabase.from("line_items").delete().eq("id", itemId);
    if (!error) {
      setItems(prev => prev.filter(li => li.id !== itemId));
    }
  }

  async function handleAddItem() {
    if (!addForm.name.trim()) return;
    setSavingAdd(true);
    const qty = parseFloat(addForm.quantity) || 1;
    const price = parseFloat(addForm.price) || 0;
    const { data, error } = await supabase
      .from("line_items")
      .insert({
        estimate_id: estimateId,
        area_id: areaId,
        module: "CLN",
        name: addForm.name.trim(),
        xactimate_code: "CLN-MANUAL",
        unit: addForm.unit,
        quantity: qty,
        unit_price: price,
        is_manual_override: true,
        sort_order: items.length,
      })
      .select("*")
      .single();
    if (!error && data) {
      setItems(prev => [...prev, data as LineItem]);
      setAddForm(emptyAddForm());
      setShowAddForm(false);
    }
    setSavingAdd(false);
  }

  const subtotal = items.reduce((sum, li) => sum + li.quantity * li.unit_price, 0);

  if (loading) {
    return (
      <div style={{ padding: "16px" }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: "60px", backgroundColor: "var(--color-border)", marginBottom: "1px" }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: "16px" }}>
      <div style={{ backgroundColor: "var(--color-surface)" }}>
        {items.map(item => (
          <div
            key={item.id}
            style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--color-border)", gap: "8px", minHeight: "60px" }}
          >
            {/* AUTO badge + name */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-on-primary)", backgroundColor: "var(--color-primary)", borderRadius: "3px", padding: "1px 5px" }}>
                  {t("cleaning.autoBadge")}
                </span>
                {item.is_manual_override && (
                  <span
                    title={t("cleaning.editedTooltip")}
                    style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--color-warning)", flexShrink: 0 }}
                  />
                )}
              </div>
              <span style={{ fontSize: "13px", color: "var(--color-text-primary)" }}>
                {item.name}
              </span>
            </div>

            {/* Qty + unit + price */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={item.quantity}
                onChange={e => updateQty(item.id, parseFloat(e.target.value) || 0)}
                style={{ width: "56px", height: "36px", border: "1px solid var(--color-border)", borderRadius: "4px", textAlign: "center", fontSize: "13px", backgroundColor: "var(--color-surface)", color: "var(--color-text-primary)" }}
                aria-label={`${item.name} quantity`}
              />
              <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{item.unit}</span>
              <span style={{ fontSize: "13px", color: "var(--color-text-primary)", fontWeight: 500, minWidth: "60px", textAlign: "right" }}>
                {formatCurrency(item.quantity * item.unit_price)}
              </span>
            </div>

            {/* Delete */}
            <button
              type="button"
              onClick={() => deleteItem(item.id)}
              aria-label={`${t("common.delete")} ${item.name}`}
              style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", color: "var(--color-error)", flexShrink: 0 }}
            >
              <Trash2 size={16} aria-hidden />
            </button>
          </div>
        ))}
      </div>

      {/* Add item form or button */}
      {showAddForm ? (
        <div style={{ backgroundColor: "var(--color-surface)", padding: "16px", borderTop: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "12px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
            {t("cleaning.addItem")}
          </span>
          <input
            type="text"
            placeholder={t("cleaning.itemNamePlaceholder")}
            value={addForm.name}
            onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
            style={{ height: "48px", border: "1px solid var(--color-border)", borderRadius: "4px", padding: "0 12px", fontSize: "14px", backgroundColor: "var(--color-surface)", color: "var(--color-text-primary)" }}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "11px", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>{t("cleaning.unit")}</label>
              <input
                type="text"
                value={addForm.unit}
                onChange={e => setAddForm(f => ({ ...f, unit: e.target.value }))}
                style={{ width: "100%", height: "48px", border: "1px solid var(--color-border)", borderRadius: "4px", padding: "0 12px", fontSize: "14px", backgroundColor: "var(--color-surface)", color: "var(--color-text-primary)" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "11px", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>{t("cleaning.qty")}</label>
              <input
                type="number"
                inputMode="decimal"
                value={addForm.quantity}
                onChange={e => setAddForm(f => ({ ...f, quantity: e.target.value }))}
                style={{ width: "100%", height: "48px", border: "1px solid var(--color-border)", borderRadius: "4px", padding: "0 12px", fontSize: "14px", backgroundColor: "var(--color-surface)", color: "var(--color-text-primary)" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "11px", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>{t("cleaning.price")}</label>
              <input
                type="number"
                inputMode="decimal"
                value={addForm.price}
                onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))}
                style={{ width: "100%", height: "48px", border: "1px solid var(--color-border)", borderRadius: "4px", padding: "0 12px", fontSize: "14px", backgroundColor: "var(--color-surface)", color: "var(--color-text-primary)" }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setAddForm(emptyAddForm()); }}
              style={{ flex: 1, height: "44px", border: "1px solid var(--color-border)", borderRadius: "4px", background: "transparent", cursor: "pointer", fontSize: "14px", color: "var(--color-text-secondary)" }}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={handleAddItem}
              disabled={savingAdd}
              style={{ flex: 1, height: "44px", borderRadius: "4px", backgroundColor: "var(--color-primary)", color: "var(--color-text-on-primary)", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}
            >
              {savingAdd ? t("common.saving") : t("common.add")}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 16px", width: "100%", border: "none", backgroundColor: "var(--color-surface)", borderTop: "1px solid var(--color-border)", cursor: "pointer", color: "var(--color-primary)", fontSize: "14px", fontWeight: 600 }}
        >
          <Plus size={16} aria-hidden />
          {t("cleaning.addItem")}
        </button>
      )}

      {/* Subtotal */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", backgroundColor: "var(--color-surface)", borderTop: "2px solid var(--color-border)", marginTop: "8px" }}>
        <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)" }}>
          {t("cleaning.subtotal")}
        </span>
        <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-primary)" }}>
          {formatCurrency(subtotal)}
        </span>
      </div>
    </div>
  );
}
