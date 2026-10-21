// Turns raw EEA groups into our fuel and Euro norm values. Every number in the CO2 data goes through here.

import type { DmvScale, EuroNorm } from "../../src/lib/dmv.ts";
import type { Fuel } from "../../src/lib/filters.ts";
import type { Stat } from "../../src/lib/co2.ts";
import type { Group, Hist } from "./ingest.ts";

export interface FuelKind {
  fuel: Fuel;
  /**
   * The DMV scale. Not derivable from `fuel`: a diesel (mild) hybrid shows as a hybrid but pays the diesel
   * scale (ZDMV-1 art. 10(3)), while `dmvScale` in src/lib/dmv.ts maps every hybrid to petrol.
   */
  scale: DmvScale;
}

/**
 * EEA fuel type + fuel mode → our fuel. Mild hybrids (VW eTSI, BMW 48 V) are reported as hybrids (Fm "H");
 * plug-ins as "P", or before Fm existed, by having an electric energy consumption figure.
 */
export function toFuel(g: Pick<Group, "ft" | "fm" | "plugin">): FuelKind | null {
  const ft = g.ft.replace(/[\s-]+/g, "/");
  if (ft === "electric") return { fuel: "electric", scale: "electric" };
  const scale = ft.startsWith("diesel") ? "diesel" : "petrol";
  if (g.fm === "P" || (ft.includes("electric") && g.plugin)) return { fuel: "plugin_hybrid", scale };
  if (g.fm === "H" || ft.includes("electric")) return { fuel: "hybrid", scale };
  if (ft === "diesel") return { fuel: "diesel", scale };
  if (ft.includes("lpg")) return { fuel: "lpg", scale };
  if (ft === "ng" || ft.startsWith("ng/") || ft.includes("cng") || ft === "petrol/ng") return { fuel: "cng", scale };
  if (ft.startsWith("petrol") || ft === "e85") return { fuel: "petrol", scale };
  return null;
}

/**
 * Raw EEA "Ech" text → our Euro norm. The letter codes are the emission codes from the EU type-approval
 * tables (Regulation (EC) 692/2008 and (EU) 2017/1151, Annex I, Appendix 6): AP–AR Euro 6d-ISC-FCM,
 * EA–EC Euro 6e (newer than 6d, our "6+"). AX is a battery-electric car (no Euro norm). Unknown codes return
 * undefined and are listed in the review report so they can be added here.
 */
export function toEuro(ech: string | null): EuroNorm | null | undefined {
  if (!ech) return undefined;
  const s = ech.toUpperCase().replace(/\s+/g, " ").trim();
  // Codes come as "EURO 6 AP", "EURO 6AP", "AP" or "EURO AX".
  const code = (re: string) => new RegExp(`(^|[\\s\\d])${re}\\b`).test(s);
  if (code("AX")) return null;
  if (code("E[A-H]") || /6\s?E\b/.test(s)) return "6+";
  if (code("A[P-R]") || /6\s?D(?!-?TEMP)/.test(s)) return "6d";
  if (/6\s?D-?TEMP/.test(s)) return "6d-temp";
  if (/6\s?C\b/.test(s)) return "6c";
  return undefined;
}

export function mergeHists(hists: Hist[]): Hist {
  const counts = new Map<number, number>();
  for (const h of hists) for (const [v, n] of h) counts.set(v, (counts.get(v) ?? 0) + n);
  return [...counts].sort((a, b) => a[0] - b[0]);
}

/** Registration-weighted median and 10th/90th percentiles; null when no CO2 figure was reported. */
export function toStat(hist: Hist): Stat | null {
  const sorted = [...hist].sort((a, b) => a[0] - b[0]);
  const total = sorted.reduce((s, [, n]) => s + n, 0);
  if (!total) return null;
  const at = (q: number) => {
    let seen = 0;
    for (const [v, n] of sorted) if ((seen += n) >= q * total) return v;
    return sorted[sorted.length - 1][0];
  };
  return { median: at(0.5), low: at(0.1), high: at(0.9) };
}
