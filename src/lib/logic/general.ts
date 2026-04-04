/**
 * General line items: PPE, Supervision, Emergency Fee, Drying Evaluation.
 */

export type JobSize = "small" | "medium" | "large";

export interface GeneralLineItem {
  module: "GEN" | "WTR";
  xactimateCode: string;
  name: string;
  unit: string;
  quantity: number;
}

/** Supervision fee by job size */
export const SUPERVISION_FEE: Record<JobSize, number> = {
  small: 150,   // < 500 SF affected
  medium: 250,  // 500–1,500 SF
  large: 400,   // > 1,500 SF
};

/** Emergency call-out fee */
export const EMERGENCY_FEE = 250;

/**
 * Classify job size by total affected square footage.
 */
export function classifyJobSize(totalAffectedSf: number): JobSize {
  if (totalAffectedSf < 500) return "small";
  if (totalAffectedSf <= 1500) return "medium";
  return "large";
}

/**
 * Whether a date/time qualifies for emergency fee.
 * Emergency = outside M–F 8am–5pm (includes evenings, weekends, holidays).
 * @param callTime - ISO 8601 datetime string or Date object
 */
export function isEmergencyCall(callTime: Date | string): boolean {
  const d = typeof callTime === "string" ? new Date(callTime) : callTime;
  const day = d.getDay();    // 0=Sun, 1=Mon, ..., 6=Sat
  const hour = d.getHours();

  const isWeekend = day === 0 || day === 6;
  const isAfterHours = hour < 8 || hour >= 17;

  return isWeekend || isAfterHours;
}

/**
 * Generate general line items for an estimate.
 *
 * Always included:
 * - Drying evaluation (flat fee)
 * - PPE consumables
 * - Supervision (based on job size)
 *
 * Conditionally included:
 * - Emergency fee (when isEmergency = true)
 */
export function generateGeneralItems(
  totalAffectedSf: number,
  isEmergency: boolean
): GeneralLineItem[] {
  const jobSize = classifyJobSize(totalAffectedSf);

  const items: GeneralLineItem[] = [
    {
      module: "WTR",
      xactimateCode: "WTR-EVLTN",
      name: "Drying evaluation / initial assessment",
      unit: "flat",
      quantity: 1,
    },
    {
      module: "GEN",
      xactimateCode: "GEN-PPE",
      name: "PPE — gloves, Tyvek, N95 masks",
      unit: "EA",
      quantity: 1,
    },
    {
      module: "GEN",
      xactimateCode: "GEN-HAUL",
      name: "Haul debris to dumpster",
      unit: "load",
      quantity: 1,
    },
    {
      module: "GEN",
      xactimateCode: "GEN-DISP",
      name: "Disposal fee",
      unit: "EA",
      quantity: 1,
    },
    {
      module: "GEN",
      xactimateCode: "GEN-SUPV",
      name: `Supervision (${jobSize} job — $${SUPERVISION_FEE[jobSize]})`,
      unit: "flat",
      quantity: 1,
    },
  ];

  if (isEmergency) {
    items.push({
      module: "GEN",
      xactimateCode: "GEN-EMRG",
      name: "Emergency call-out fee (after-hours / weekend)",
      unit: "flat",
      quantity: 1,
    });
  }

  return items;
}
