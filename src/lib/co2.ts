// CO2 and Euro norm from EU registration data (EEA, Regulation (EU) 2019/631), built by scripts/co2 (docs/CO2.md).
// One row per model, fuel, engine power and registration year, so a car is found from what every listing shows.
// Only type imports here: the build scripts load this file with plain node.

import type { EuroNorm } from "./dmv";
import type { Fuel } from "./filters";

/** Registration-weighted median and 10th/90th percentiles, g/km. */
export interface Stat {
  median: number;
  low: number;
  high: number;
}

/**
 * [fuel, diesel engine (1: a hybrid that pays the diesel scale), kW, registration year, WLTP median, NEDC median,
 * registrations, most common Euro norm (2023 data on)]. Tuples keep the per-make files small.
 */
export type Co2Row = [Fuel, 0 | 1, number, number, number | null, number | null, number, EuroNorm | null];

/** Per make: model id → rows. */
export type Co2Data = Record<string, Co2Row[]>;

export interface Co2Match {
  co2: number;
  cycle: "wltp" | "nedc";
  /** From the EEA data for 2023 on; otherwise the date rule applies. */
  euro?: EuroNorm;
  /** A hybrid with a diesel engine: pays the diesel DMV scale. */
  dieselScale: boolean;
  /** Registrations behind the figure. */
  cars: number;
  /** The registration year the figure is from; can differ from the car's when that year has no data. */
  year: number;
  /**
   * False for a hybrid matched over all its power levels: the EU data has the combustion engine's power,
   * listings usually the system power.
   */
  powerMatched: boolean;
}

/** WLTP figures are on every car first registered from September 2018; older ones usually list NEDC. */
export const WLTP_FROM = new Date(2018, 8, 1);

/**
 * The norm every newly registered car had to meet at a date (worst case; a car may meet a newer one early):
 * Euro 4 from Jan 2006, 5 from Jan 2011, 6 from Sep 2015, 6c from Sep 2018, 6d-TEMP from Sep 2019, 6d from
 * Jan 2021.
 */
export function euroByRegistration(year: number, month = 12): EuroNorm {
  const at = year * 12 + month - 1;
  const from = (y: number, m: number) => at >= y * 12 + m - 1;
  if (from(2021, 1)) return "6d";
  if (from(2019, 9)) return "6d-temp";
  if (from(2018, 9)) return "6c";
  if (from(2015, 9)) return "6";
  if (from(2011, 1)) return "5";
  if (from(2006, 1)) return "4";
  return "3";
}

/** How far the data may be from the listing's power: rounding differs between countries and kW/hp. */
export const kwTolerance = (kw: number) => Math.max(2, Math.round(kw * 0.03));
/** Use a neighbouring registration year when the car's own has no data (e.g. 2026 before it is published). */
const MAX_YEAR_GAP = 3;

/** Registration-weighted median of [value, registrations] pairs. */
function weightedMedian(pairs: [number, number][]): number {
  const sorted = [...pairs].sort((a, b) => a[0] - b[0]);
  const total = sorted.reduce((s, [, n]) => s + n, 0);
  let seen = 0;
  for (const [v, n] of sorted) if ((seen += n) >= total / 2) return v;
  return sorted[sorted.length - 1][0];
}

/**
 * The CO2 figure a car of this model, fuel and power most likely carries, for its first registration
 * (undefined: a new car, registered at `now`). Undefined when the data has no such engine.
 */
export function lookupCo2(
  rows: Co2Row[] | undefined,
  q: { fuel: Fuel; kw: number; firstReg: Date | undefined; now: Date },
): Co2Match | undefined {
  if (!rows || q.fuel === "electric") return undefined;
  const tol = kwTolerance(q.kw);
  const ofFuel = rows.filter(([fuel]) => fuel === q.fuel);
  let engine = ofFuel.filter(([, , kw]) => Math.abs(kw - q.kw) <= tol);
  const powerMatched = engine.length > 0;
  if (!powerMatched && (q.fuel === "hybrid" || q.fuel === "plugin_hybrid")) engine = ofFuel;
  if (!engine.length) return undefined;

  const at = q.firstReg ?? q.now;
  const value = (r: Co2Row, cycle: "wltp" | "nedc") => (cycle === "nedc" ? r[5] : r[4]);
  // The registration papers carry NEDC before September 2018, WLTP after; fall back to the other one.
  const cycles = at < WLTP_FROM ? (["nedc", "wltp"] as const) : (["wltp", "nedc"] as const);
  const years = [...new Set(engine.map((r) => r[3]))]
    .filter((y) => Math.abs(y - at.getFullYear()) <= MAX_YEAR_GAP)
    // Nearest year; on a tie the earlier one, whose figures are the ones the car was approved with.
    .sort((a, b) => Math.abs(a - at.getFullYear()) - Math.abs(b - at.getFullYear()) || a - b);

  for (const year of years) {
    for (const cycle of cycles) {
      const pick = engine.filter((r) => r[3] === year && value(r, cycle) !== null);
      if (pick.length) return { ...match(pick, cycle, year, (r) => value(r, cycle)!), powerMatched };
    }
  }
  return undefined;
}

function match(
  pick: Co2Row[],
  cycle: "wltp" | "nedc",
  year: number,
  value: (r: Co2Row) => number,
): Omit<Co2Match, "powerMatched"> {
  const cars = pick.reduce((s, r) => s + r[6], 0);
  const euros = new Map<EuroNorm, number>();
  for (const r of pick) if (r[7]) euros.set(r[7], (euros.get(r[7]) ?? 0) + r[6]);
  const diesel = pick.reduce((s, r) => s + (r[1] ? r[6] : 0), 0);
  return {
    co2: weightedMedian(pick.map((r) => [value(r), r[6]])),
    cycle,
    euro: [...euros].sort((a, b) => b[1] - a[1])[0]?.[0],
    dieselScale: diesel * 2 > cars,
    cars,
    year,
  };
}

/** One engine of a model in the EU data: a fuel and power level, power figures a few kW apart merged. */
export interface Engine {
  fuel: Fuel;
  kw: number;
  /** Registrations behind it (around the year asked for, if any). */
  cars: number;
  /** Years it was registered in, over all the data. */
  fromYear: number;
  toYear: number;
}

/** Engines with fewer registrations than this share of the model's are left out of the picker. */
const MIN_ENGINE_SHARE = 0.005;

/**
 * The model's engines, most registered first, for a picker. With a registration year, only engines
 * registered within a year of it.
 */
export function listEngines(rows: Co2Row[] | undefined, year?: number): Engine[] {
  if (!rows) return [];
  const groups = new Map<string, Engine>();
  for (const [fuel, , kw, y, , , n] of rows) {
    const key = `${fuel}:${kw}`;
    const g = groups.get(key) ?? { fuel, kw, cars: 0, fromYear: y, toYear: y };
    if (year === undefined || Math.abs(y - year) <= 1) g.cars += n;
    g.fromYear = Math.min(g.fromYear, y);
    g.toYear = Math.max(g.toYear, y);
    groups.set(key, g);
  }
  const merged: Engine[] = [];
  for (const g of [...groups.values()].filter((x) => x.cars > 0).sort((a, b) => b.cars - a.cars)) {
    const into = merged.find((m) => m.fuel === g.fuel && Math.abs(m.kw - g.kw) <= kwTolerance(m.kw));
    if (!into) {
      merged.push({ ...g });
      continue;
    }
    into.cars += g.cars;
    into.fromYear = Math.min(into.fromYear, g.fromYear);
    into.toYear = Math.max(into.toYear, g.toYear);
  }
  const total = merged.reduce((s, e) => s + e.cars, 0);
  return merged.filter((e) => e.cars >= total * MIN_ENGINE_SHARE);
}
