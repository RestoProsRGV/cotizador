/**
 * IICRC S500 equipment calculations.
 * All formulas are pure functions — no side effects, no I/O.
 */

export interface AreaDimensions {
  /** Square feet of affected floor area */
  affectedSf: number;
  /** Length in feet */
  length: number;
  /** Width in feet */
  width: number;
  /** Height in feet */
  height: number;
}

export interface EquipmentCount {
  airMovers: number;
  dehumidifiers: number;
  airScrubbers: number;
}

/**
 * Air movers: 1 per 50 SF of affected area, minimum 2.
 * IICRC S500 §13.3
 */
export function calcAirMovers(affectedSf: number): number {
  if (affectedSf <= 0) return 0;
  return Math.max(2, Math.ceil(affectedSf / 50));
}

/**
 * Dehumidifiers: 1 per 100 cubic feet of drying chamber volume, minimum 1.
 * IICRC S500 §13.4
 */
export function calcDehumidifiers(dimensions: Pick<AreaDimensions, "length" | "width" | "height">): number {
  const volumeCf = dimensions.length * dimensions.width * dimensions.height;
  if (volumeCf <= 0) return 0;
  return Math.max(1, Math.ceil(volumeCf / 100));
}

/**
 * Air scrubbers: 1 per 300 SF, minimum 1.
 * Triggered by Cat 2, Cat 3, or mold. Caller is responsible for trigger check.
 * IICRC S500 §13.5 / S520 §8
 */
export function calcAirScrubbers(affectedSf: number): number {
  if (affectedSf <= 0) return 0;
  return Math.max(1, Math.ceil(affectedSf / 300));
}

/**
 * Full equipment package for one drying chamber.
 * airScrubbers is 0 unless needsAirScrubber is true (Cat 2/3/mold).
 */
export function calcEquipmentForChamber(
  dimensions: AreaDimensions,
  needsAirScrubber: boolean
): EquipmentCount {
  return {
    airMovers: calcAirMovers(dimensions.affectedSf),
    dehumidifiers: calcDehumidifiers(dimensions),
    airScrubbers: needsAirScrubber ? calcAirScrubbers(dimensions.affectedSf) : 0,
  };
}

/**
 * Sum equipment across multiple chambers.
 */
export function sumEquipment(chambers: EquipmentCount[]): EquipmentCount {
  return chambers.reduce(
    (acc, c) => ({
      airMovers: acc.airMovers + c.airMovers,
      dehumidifiers: acc.dehumidifiers + c.dehumidifiers,
      airScrubbers: acc.airScrubbers + c.airScrubbers,
    }),
    { airMovers: 0, dehumidifiers: 0, airScrubbers: 0 }
  );
}
