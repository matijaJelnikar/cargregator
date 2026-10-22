// Matching a car (year, fuel, power) to the car-info data. Pure functions, shared by the search form, the results
// page and the check page.

import type { CarEngine, CarGeneration, CarRecall } from "./carinfoDb";
import { kwTolerance } from "./co2";
import type { Fuel } from "./filters";

/** The generation produced in `year`; in the overlap year of two generations the newer one. */
export function generationFor(gens: CarGeneration[], year: number): CarGeneration | undefined {
  return gens.filter((g) => year >= g.year_from && year <= (g.year_to ?? 9999)).sort((a, b) => b.year_from - a.year_from)[0];
}

/** Generations that were produced at any time between `from` and `to` (either may be open). */
export function generationsInRange(gens: CarGeneration[], from?: number, to?: number): CarGeneration[] {
  return gens.filter((g) => (to === undefined || g.year_from <= to) && (from === undefined || (g.year_to ?? 9999) >= from));
}

/**
 * The engine of a generation that best fits a car: same fuel, power within the usual rounding tolerance, preferring
 * an engine sold in the car's year (one year of slack), then the closest power, then the most registered.
 */
export function engineFor(gen: CarGeneration, q: { fuel: Fuel; kw: number; year?: number }): CarEngine | undefined {
  const tol = kwTolerance(q.kw);
  const fits = gen.engines.filter((e) => e.fuel === q.fuel && e.kw !== null && Math.abs(e.kw - q.kw) <= tol);
  const inYear = (e: CarEngine) =>
    q.year === undefined || e.year_from === null || e.year_to === null || (q.year >= e.year_from - 1 && q.year <= e.year_to + 1);
  return fits.sort(
    (a, b) => Number(!inYear(a)) - Number(!inYear(b)) || Math.abs(a.kw! - q.kw) - Math.abs(b.kw! - q.kw) || b.registrations - a.registrations,
  )[0];
}

/** Recalls whose years overlap [from, to]; a recall with unknown years is kept. */
export function recallsInYears(recalls: CarRecall[], from: number | null, to: number | null): CarRecall[] {
  return recalls.filter((r) => from === null || to === null || r.year_from === null || r.year_to === null || (r.year_to >= from && r.year_from <= to));
}

/** Recalls of a generation that can apply to a car first registered in `year` (production is a year either way). */
export const recallsFor = (gen: CarGeneration, year?: number): CarRecall[] => (year === undefined ? gen.recalls : recallsInYears(gen.recalls, year - 1, year + 1));
