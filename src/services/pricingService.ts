import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { HARDCODED_PRICES, getHardcodedPrice } from "@/constants/hardcodedPrices";

export type PriceSource = "db" | "hardcoded";

export interface PricingStatus {
  source: PriceSource;
  itemCount: number;
}

/**
 * Fetches DB prices for the current tenant and merges them with hardcoded
 * fallbacks. Returns a stable Record<code, unit_price> that modules can
 * use synchronously as `prices[code] ?? 0`.
 *
 * On mount: initializes synchronously from HARDCODED_PRICES (no flicker).
 * After DB fetch: if tenant has price_items, switches to DB values.
 * If DB fetch fails or returns empty: keeps hardcoded values silently.
 */
export function usePriceMap(): Record<string, number> {
  const [prices, setPrices] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const [code, item] of Object.entries(HARDCODED_PRICES)) {
      initial[code] = item.unit_price;
    }
    return initial;
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchDbPrices() {
      const { data, error } = await supabase
        .from("price_items")
        .select("xactimate_code, unit_price");

      if (cancelled || error || !data || data.length === 0) return;

      const dbMap: Record<string, number> = {};
      for (const row of data) {
        if (row.xactimate_code && row.unit_price != null) {
          dbMap[row.xactimate_code] = row.unit_price;
        }
      }

      // Merge: DB values override hardcoded; hardcoded fills gaps
      const merged: Record<string, number> = {};
      for (const [code, item] of Object.entries(HARDCODED_PRICES)) {
        merged[code] = dbMap[code] ?? item.unit_price;
      }
      // Include any DB codes not in hardcoded catalog
      for (const [code, price] of Object.entries(dbMap)) {
        if (!(code in merged)) merged[code] = price;
      }

      setPrices(merged);
    }

    fetchDbPrices();
    return () => { cancelled = true; };
  }, []);

  return prices;
}

/**
 * Returns the source and count of prices loaded for the current tenant.
 * Used by AdminPrices to display a fallback warning banner.
 */
export async function getPricingStatus(): Promise<PricingStatus> {
  const { data, error } = await supabase
    .from("price_items")
    .select("xactimate_code", { count: "exact", head: false });

  if (error || !data || data.length === 0) {
    return { source: "hardcoded", itemCount: Object.keys(HARDCODED_PRICES).length };
  }
  return { source: "db", itemCount: data.length };
}

/** Synchronous single-price lookup — useful outside React components. */
export { getHardcodedPrice };
