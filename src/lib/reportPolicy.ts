// What report content the public sees before a person has reviewed it (openspec set-report-content-policy). Reports
// are AI-written and AI-checked; the claims that hurt most when wrong are softened until a generation is reviewed.

import type { CarEngine, CarFailure, CarGeneration } from "./carinfoDb";

/** Supported failures an engine needs before an unreviewed "avoid" is shown as is. */
export const AVOID_MIN_SUPPORTED = 2;

/** Failures the checker found supported for this engine or another power of the same engine (same name). */
export function supportedFailures(engine: Pick<CarEngine, "name">, gen: Pick<CarGeneration, "engines" | "failures">) {
  const ids = new Set(gen.engines.filter((e) => e.name === engine.name).map((e) => e.id));
  return gen.failures.filter((f) => f.engine_id != null && ids.has(f.engine_id) && f.ai_check === "supported").length;
}

/** The verdict to show: a reviewed generation shows the reviewer's verdict; an unreviewed "avoid" stays only with
 * at least AVOID_MIN_SUPPORTED supported failures and otherwise reads "known issues". */
export function publicVerdict(engine: Pick<CarEngine, "name" | "verdict">, gen: Pick<CarGeneration, "status" | "engines" | "failures">): CarEngine["verdict"] {
  if (engine.verdict !== "avoid" || gen.status === "reviewed") return engine.verdict;
  return supportedFailures(engine, gen) >= AVOID_MIN_SUPPORTED ? "avoid" : "issues";
}

export type CostBand = "low" | "med" | "high";

/** Repair cost band by the upper estimate: under 500 EUR low, up to 1500 EUR medium, above that high. */
export function costBand(f: Pick<CarFailure, "cost_min" | "cost_max">): CostBand | null {
  const top = f.cost_max ?? f.cost_min;
  if (top == null) return null;
  return top < 500 ? "low" : top <= 1500 ? "med" : "high";
}

/** Exact repair cost ranges are AI estimates, so they show only once the generation is reviewed; bands until then. */
export const showExactCost = (gen: Pick<CarGeneration, "status">) => gen.status === "reviewed";
