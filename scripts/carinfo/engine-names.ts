import type { ReportAnswer } from "../../src/lib/carinfo.ts";

export interface EngineIdentity { name: string; engine_code?: string | null }

/** Explicitly reviewed report typos; scoped to a generation so unrelated engines never inherit them. */
const ALIASES: Record<string, Record<string, string>> = {
  "audi-q3/f3": { "1.4 TFSe e (EA211)": "1.4 TFSI e" },
  "bmw-1-series/f20": { "125i (N20/B48)": "125i 2.0" },
  "bmw-x5/g05": { "N63 (M50i)": "M50i" },
  "nissan-micra/k15": {
    "40 kWh: electric, 90–90 kW, 2025–2025": "40 kWh",
    "52 kWh: electric, 110–110 kW, 2025–2025": "52 kWh",
  },
};
const normal = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
const codes = (values: string[]) => [...new Set(values.flatMap((s) => s.split("/").map(normal)))].sort().join("/");

/** Exact name first; harmless case/spacing next; a suffix only when it equals the known codes for that name. */
export function resolveEngineName(name: string, engines: EngineIdentity[], scope = ""): string | undefined {
  if (engines.some((e) => e.name === name)) return name;
  const alias = ALIASES[scope]?.[name];
  if (alias && engines.some((e) => e.name === alias)) return alias;
  const names = [...new Set(engines.map((e) => e.name))];
  const unique = (candidates: string[]) => candidates.length === 1 ? candidates[0] : undefined;
  const spaced = unique(names.filter((n) => normal(n) === normal(name)));
  if (spaced) return spaced;
  const suffix = name.trim().match(/^(.*?)\s+\(([^()]*)\)$/);
  if (!suffix) return undefined;
  const base = names.includes(suffix[1]) ? suffix[1] : unique(names.filter((n) => normal(n) === normal(suffix[1])));
  if (!base) return undefined;
  const known = engines.filter((e) => e.name === base);
  // No guessed code, partial family match, drive/gearbox suffix removal, or prefix/fuzzy matching.
  const knownCodes = known.map((e) => e.engine_code).filter((c): c is string => !!c);
  if (!knownCodes.length) return undefined;
  return codes([suffix[2]]) === codes(knownCodes) ? base : undefined;
}

export class EngineMatchError extends Error {}

/** Both assessment keys and failure references must resolve; missing assessments are explicit errors too. */
export function matchReportEngines(answer: ReportAnswer, engines: EngineIdentity[], scope = "") {
  const issues: string[] = [];
  const seen = new Set<string>();
  const mapped = answer.engines.map((e) => {
    const name = resolveEngineName(e.name, engines, scope);
    if (!name) issues.push("Unknown assessment: " + e.name);
    else if (seen.has(name)) issues.push("Duplicate assessment: " + name);
    if (name) seen.add(name);
    return { ...e, name: name ?? e.name };
  });
  const failures = answer.failures.map((f) => {
    if (f.engine === null) return f;
    const engine = resolveEngineName(f.engine, engines, scope);
    if (!engine) issues.push("Unknown failure engine: " + f.engine);
    return { ...f, engine: engine ?? f.engine };
  });
  const missing = [...new Set(engines.map((e) => e.name))].filter((name) => !seen.has(name));
  issues.push(...missing.map((name) => "Missing assessment: " + name));
  return { answer: { ...answer, engines: mapped, failures }, issues, missing };
}