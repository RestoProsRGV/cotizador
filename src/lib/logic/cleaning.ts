/**
 * Cleaning line-item auto-generation rules.
 * Based on IICRC S500/S520 and RestoPros protocols.
 */

export type WaterCategory = "cat1" | "cat2" | "cat3" | "mold";

export interface CleaningLineItem {
  module: "CLN";
  xactimateCode: string;
  name: string;
  unit: string;
  quantity: number;
}

/**
 * Auto-generate cleaning line items for a given category and affected area.
 *
 * Rules:
 * - cat1 (no demo): no cleaning items
 * - cat1 (with demo): HEPA vacuum + antimicrobial
 * - cat2: HEPA vacuum + antimicrobial + disinfectant
 * - cat3: HEPA vacuum + antimicrobial + disinfectant + full-room clean + odor control
 * - mold: HEPA vacuum (all surfaces) + antimicrobial (all surfaces) + clearance test
 */
export function generateCleaningItems(
  category: WaterCategory,
  affectedSf: number,
  hasDemo: boolean
): CleaningLineItem[] {
  const items: CleaningLineItem[] = [];

  const hepa: CleaningLineItem = {
    module: "CLN",
    xactimateCode: "CLN-HEPA",
    name: "HEPA vacuum — affected surfaces",
    unit: "SF",
    quantity: affectedSf,
  };

  const antimicrobial: CleaningLineItem = {
    module: "CLN",
    xactimateCode: "CLN-ANTIM",
    name: "Antimicrobial application",
    unit: "SF",
    quantity: affectedSf,
  };

  const disinfectant: CleaningLineItem = {
    module: "CLN",
    xactimateCode: "CLN-DISINF",
    name: "Disinfectant application",
    unit: "SF",
    quantity: affectedSf,
  };

  const fullRoom: CleaningLineItem = {
    module: "CLN",
    xactimateCode: "CLN-FULL-RM",
    name: "Full room cleaning (walls, ceiling, floor)",
    unit: "SF",
    quantity: affectedSf,
  };

  const odorControl: CleaningLineItem = {
    module: "CLN",
    xactimateCode: "WTR-ODOR",
    name: "Odor control treatment",
    unit: "SF",
    quantity: affectedSf,
  };

  const clearanceTest: CleaningLineItem = {
    module: "CLN",
    xactimateCode: "WTR-CLRC-TEST",
    name: "Post-remediation clearance air sample",
    unit: "EA",
    quantity: 1,
  };

  switch (category) {
    case "cat1":
      if (hasDemo) {
        items.push(hepa, antimicrobial);
      }
      break;
    case "cat2":
      items.push(hepa, antimicrobial, disinfectant);
      break;
    case "cat3":
      items.push(hepa, antimicrobial, disinfectant, fullRoom, odorControl);
      break;
    case "mold":
      items.push(hepa, antimicrobial, clearanceTest);
      break;
  }

  return items;
}

/**
 * Whether a given category requires containment barriers.
 */
export function requiresContainment(category: WaterCategory): boolean {
  return category === "cat2" || category === "cat3" || category === "mold";
}

/**
 * Whether a given category requires negative pressure.
 */
export function requiresNegativePressure(category: WaterCategory): boolean {
  return category === "cat3" || category === "mold";
}
