import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Wind, Droplets, Filter } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AppHeader } from "@/components/layout/AppHeader";
import { EstimateNav } from "@/components/layout/EstimateNav";
import { calcAirMovers, calcDehumidifiers, calcAirScrubbers } from "@/lib/logic/equipment";
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

interface Estimate {
  id: string;
  category: string | null;
}

function formatCurrency(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function Equipment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [items, setItems] = useState<LineItem[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  // local state for editing qty and days
  const [airMoverQty, setAirMoverQty] = useState(0);
  const [airMoverDays, setAirMoverDays] = useState(3);
  const [dehumQty, setDehumQty] = useState(0);
  const [dehumDays, setDehumDays] = useState(3);
  const [scrubberQty, setScrubberQty] = useState(0);
  const [scrubberDays, setScrubberDays] = useState(3);

  useEffect(() => {
    loadData();
  }, [id]);

  const totalSf = areas.reduce((sum, a) => sum + a.length * a.width, 0);
  const needsAirScrubber =
    estimate?.category === "cat2" ||
    estimate?.category === "cat3" ||
    estimate?.category === "mold";

  async function loadData() {
    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      setAuthError(true);
      setLoading(false);
      return;
    }

    const [{ data: estData }, { data: areaData }, { data: eqpData }] = await Promise.all([
      supabase.from("estimates").select("id,category").eq("id", id).single(),
      supabase.from("areas").select("id,length,width,height").eq("estimate_id", id),
      supabase
        .from("line_items")
        .select("*")
        .eq("estimate_id", id)
        .eq("module", "EQP")
        .order("sort_order", { ascending: true }),
    ]);

    const est = estData as Estimate | null;
    const fetchedAreas = (areaData as Area[]) || [];
    const existingItems = (eqpData as LineItem[]) || [];

    setEstimate(est);
    setAreas(fetchedAreas);

    const sf = fetchedAreas.reduce((sum, a) => sum + a.length * a.width, 0);
    const needsScrubber =
      est?.category === "cat2" ||
      est?.category === "cat3" ||
      est?.category === "mold";

    // Calculate totals from IICRC
    const amQty = fetchedAreas.reduce((sum, a) => sum + calcAirMovers(a.length * a.width), 0);
    const dhQty = fetchedAreas.reduce(
      (sum, a) => sum + calcDehumidifiers({ length: a.length, width: a.width, height: a.height }),
      0
    );
    const asQty = needsScrubber ? calcAirScrubbers(sf) : 0;

    if (existingItems.length === 0) {
      // Insert auto-calculated items
      const toInsert = [
        {
          estimate_id: id,
          module: "EQP",
          name: t("equipment.airMover"),
          xactimate_code: "EQP-AMVR",
          unit: "day",
          quantity: amQty * 3,
          unit_price: getPrice("EQP-AMVR"),
          is_manual_override: false,
          sort_order: 0,
        },
        {
          estimate_id: id,
          module: "EQP",
          name: t("equipment.dehumidifier"),
          xactimate_code: "EQP-DH-LG",
          unit: "day",
          quantity: dhQty * 3,
          unit_price: getPrice("EQP-DH-LG"),
          is_manual_override: false,
          sort_order: 1,
        },
        ...(needsScrubber
          ? [
              {
                estimate_id: id,
                module: "EQP",
                name: t("equipment.airScrubber"),
                xactimate_code: "EQP-ASCR",
                unit: "day",
                quantity: asQty * 3,
                unit_price: getPrice("EQP-ASCR"),
                is_manual_override: false,
                sort_order: 2,
              },
            ]
          : []),
      ];

      const { data: inserted } = await supabase
        .from("line_items")
        .insert(toInsert)
        .select("*");

      const insertedItems = (inserted as LineItem[]) || [];
      setItems(insertedItems);

      // Set local state
      setAirMoverQty(amQty);
      setAirMoverDays(3);
      setDehumQty(dhQty);
      setDehumDays(3);
      setScrubberQty(asQty);
      setScrubberDays(3);
    } else {
      setItems(existingItems);
      // Parse existing items to restore local state
      const amItem = existingItems.find((li) => li.xactimate_code === "EQP-AMVR");
      const dhItem = existingItems.find((li) => li.xactimate_code === "EQP-DH-LG");
      const asItem = existingItems.find((li) => li.xactimate_code === "EQP-ASCR");

      if (amItem) {
        setAirMoverQty(amQty || Math.max(2, Math.ceil(sf / 50)));
        const d = amQty > 0 ? Math.round(amItem.quantity / amQty) : 3;
        setAirMoverDays(d > 0 ? d : 3);
      }
      if (dhItem) {
        setDehumQty(dhQty || 1);
        const d = dhQty > 0 ? Math.round(dhItem.quantity / dhQty) : 3;
        setDehumDays(d > 0 ? d : 3);
      }
      if (asItem) {
        setScrubberQty(asQty || 1);
        const d = asQty > 0 ? Math.round(asItem.quantity / asQty) : 3;
        setScrubberDays(d > 0 ? d : 3);
      } else {
        setScrubberQty(asQty);
        setScrubberDays(3);
      }
    }

    setLoading(false);
  }

  async function updateItem(code: string, qty: number, days: number) {
    const totalQty = qty * days;
    const item = items.find((li) => li.xactimate_code === code);
    if (!item) return;
    const { error } = await supabase
      .from("line_items")
      .update({ quantity: totalQty, is_manual_override: true })
      .eq("id", item.id);
    if (!error) {
      setItems((prev) =>
        prev.map((li) =>
          li.id === item.id ? { ...li, quantity: totalQty, is_manual_override: true } : li
        )
      );
    }
  }

  function QtyControl({
    value,
    onChange,
    label,
  }: {
    value: number;
    onChange: (v: number) => void;
    label: string;
  }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label={`Decrease ${label}`}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "4px",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-background)",
            cursor: "pointer",
            fontSize: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-primary)",
          }}
        >
          −
        </button>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          aria-label={label}
          style={{
            width: "48px",
            height: "40px",
            border: "1px solid var(--color-border)",
            borderRadius: "4px",
            textAlign: "center",
            fontSize: "14px",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text-primary)",
          }}
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          aria-label={`Increase ${label}`}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "4px",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-background)",
            cursor: "pointer",
            fontSize: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-primary)",
          }}
        >
          +
        </button>
      </div>
    );
  }

  const subtotal = items.reduce((sum, li) => sum + li.quantity * li.unit_price, 0);

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
        <AppHeader title={t("equipment.title")} onBack={() => navigate(-1)} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
      <AppHeader title={t("equipment.title")} onBack={() => navigate(-1)} />

      <main style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {loading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: "120px",
                backgroundColor: "var(--color-border)",
                borderRadius: "4px",
              }}
            />
          ))
        ) : (
          <>
            <p
              style={{
                fontSize: "12px",
                color: "var(--color-text-secondary)",
                marginBottom: "4px",
              }}
            >
              {t("equipment.iicrcNote")}
            </p>

            {/* Air Movers */}
            <div
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "4px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Wind size={20} style={{ color: "var(--color-primary)" }} aria-hidden />
                  <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {t("equipment.airMover")}
                  </span>
                </div>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-primary)" }}>
                  {formatCurrency(airMoverQty * airMoverDays * getPrice("EQP-AMVR"))}
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0 }}>
                {t("equipment.airMoverFormula", { totalSf: Math.round(totalSf), qty: airMoverQty })}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <div>
                  <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: "0 0 4px" }}>
                    {t("equipment.units")}
                  </p>
                  <QtyControl
                    value={airMoverQty}
                    onChange={(v) => {
                      setAirMoverQty(v);
                      updateItem("EQP-AMVR", v, airMoverDays);
                    }}
                    label={t("equipment.airMover")}
                  />
                </div>
                <div>
                  <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: "0 0 4px" }}>
                    {t("equipment.days")}
                  </p>
                  <QtyControl
                    value={airMoverDays}
                    onChange={(v) => {
                      setAirMoverDays(v);
                      updateItem("EQP-AMVR", airMoverQty, v);
                    }}
                    label={`${t("equipment.airMover")} days`}
                  />
                </div>
                <span style={{ fontSize: "13px", color: "var(--color-text-secondary)", alignSelf: "flex-end", paddingBottom: "4px" }}>
                  × ${getPrice("EQP-AMVR")}/{t("equipment.dayUnit")}
                </span>
              </div>
            </div>

            {/* Dehumidifiers */}
            <div
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "4px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Droplets size={20} style={{ color: "var(--color-primary)" }} aria-hidden />
                  <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {t("equipment.dehumidifier")}
                  </span>
                </div>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-primary)" }}>
                  {formatCurrency(dehumQty * dehumDays * getPrice("EQP-DH-LG"))}
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0 }}>
                {t("equipment.dehumFormula", { qty: dehumQty })}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <div>
                  <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: "0 0 4px" }}>
                    {t("equipment.units")}
                  </p>
                  <QtyControl
                    value={dehumQty}
                    onChange={(v) => {
                      setDehumQty(v);
                      updateItem("EQP-DH-LG", v, dehumDays);
                    }}
                    label={t("equipment.dehumidifier")}
                  />
                </div>
                <div>
                  <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: "0 0 4px" }}>
                    {t("equipment.days")}
                  </p>
                  <QtyControl
                    value={dehumDays}
                    onChange={(v) => {
                      setDehumDays(v);
                      updateItem("EQP-DH-LG", dehumQty, v);
                    }}
                    label={`${t("equipment.dehumidifier")} days`}
                  />
                </div>
                <span style={{ fontSize: "13px", color: "var(--color-text-secondary)", alignSelf: "flex-end", paddingBottom: "4px" }}>
                  × ${getPrice("EQP-DH-LG")}/{t("equipment.dayUnit")}
                </span>
              </div>
            </div>

            {/* Air Scrubbers — only if needed */}
            {needsAirScrubber && (
              <div
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "4px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Filter size={20} style={{ color: "var(--color-primary)" }} aria-hidden />
                    <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                      {t("equipment.airScrubber")}
                    </span>
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-primary)" }}>
                    {formatCurrency(scrubberQty * scrubberDays * getPrice("EQP-ASCR"))}
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0 }}>
                  {t("equipment.scrubberFormula", { totalSf: Math.round(totalSf), qty: scrubberQty })}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <div>
                    <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: "0 0 4px" }}>
                      {t("equipment.units")}
                    </p>
                    <QtyControl
                      value={scrubberQty}
                      onChange={(v) => {
                        setScrubberQty(v);
                        updateItem("EQP-ASCR", v, scrubberDays);
                      }}
                      label={t("equipment.airScrubber")}
                    />
                  </div>
                  <div>
                    <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: "0 0 4px" }}>
                      {t("equipment.days")}
                    </p>
                    <QtyControl
                      value={scrubberDays}
                      onChange={(v) => {
                        setScrubberDays(v);
                        updateItem("EQP-ASCR", scrubberQty, v);
                      }}
                      label={`${t("equipment.airScrubber")} days`}
                    />
                  </div>
                  <span style={{ fontSize: "13px", color: "var(--color-text-secondary)", alignSelf: "flex-end", paddingBottom: "4px" }}>
                    × ${getPrice("EQP-ASCR")}/{t("equipment.dayUnit")}
                  </span>
                </div>
              </div>
            )}

            {/* Subtotal */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "4px",
                marginTop: "4px",
              }}
            >
              <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                {t("equipment.subtotal")}
              </span>
              <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-primary)" }}>
                {formatCurrency(subtotal)}
              </span>
            </div>
          </>
        )}
      </main>

      <EstimateNav />
    </div>
  );
}
