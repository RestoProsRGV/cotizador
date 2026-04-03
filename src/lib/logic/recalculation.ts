/**
 * Mid-estimate recalculation with isManualOverride protection.
 *
 * When a tech manually edits a line item quantity, that override is preserved
 * even when the system recalculates (e.g., after adding a new room).
 * The system_value is always updated to reflect what the formula would produce,
 * but quantity stays at the tech's value when is_manual_override = true.
 */

export interface LineItemSnapshot {
  id: string;
  xactimateCode: string;
  quantity: number;
  systemValue: number | null;
  isManualOverride: boolean;
}

export interface RecalcInput {
  id: string;
  xactimateCode: string;
  newSystemValue: number;
}

export interface RecalcResult {
  id: string;
  quantity: number;
  systemValue: number;
  isManualOverride: boolean;
  /** True if the quantity was changed by recalculation */
  changed: boolean;
}

/**
 * Recalculate line items, respecting manual overrides.
 *
 * For each item:
 * - systemValue is always updated to newSystemValue
 * - If isManualOverride = false: quantity = newSystemValue
 * - If isManualOverride = true: quantity stays unchanged (tech's value preserved)
 */
export function recalcLineItems(
  existing: LineItemSnapshot[],
  updates: RecalcInput[]
): RecalcResult[] {
  const updateMap = new Map(updates.map((u) => [u.xactimateCode, u]));

  return existing.map((item) => {
    const update = updateMap.get(item.xactimateCode);

    if (!update) {
      // No recalc instruction for this item — leave untouched
      return {
        id: item.id,
        quantity: item.quantity,
        systemValue: item.systemValue ?? item.quantity,
        isManualOverride: item.isManualOverride,
        changed: false,
      };
    }

    const newQuantity = item.isManualOverride
      ? item.quantity           // Preserve tech's manual value
      : update.newSystemValue;  // Accept system calculation

    return {
      id: item.id,
      quantity: newQuantity,
      systemValue: update.newSystemValue,
      isManualOverride: item.isManualOverride,
      changed: newQuantity !== item.quantity,
    };
  });
}

/**
 * Mark a line item as manually overridden.
 * Call this when a tech edits a quantity in the UI.
 */
export function applyManualOverride(
  item: LineItemSnapshot,
  newQuantity: number
): LineItemSnapshot {
  return {
    ...item,
    quantity: newQuantity,
    systemValue: item.systemValue ?? item.quantity,
    isManualOverride: true,
  };
}

/**
 * Clear a manual override, restoring system-calculated value.
 * Call this when a tech taps "Reset to calculated" on a line item.
 */
export function clearManualOverride(item: LineItemSnapshot): LineItemSnapshot {
  const restored = item.systemValue ?? item.quantity;
  return {
    ...item,
    quantity: restored,
    isManualOverride: false,
  };
}
