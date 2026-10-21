import { findCity } from "@/data/cities";
import { findMake, findModel } from "@/data/makes";
import type { SearchFilters } from "./filters";
import { formatNumber, t, type Dict, type Locale } from "./i18n";

const range = (from: number | undefined, to: number | undefined, fmt: (n: number) => string, upTo: string) =>
  from && to ? `${fmt(from)}–${fmt(to)}` : from ? `${fmt(from)}+` : to ? t(upTo, { v: fmt(to) }) : undefined;

export interface SummaryPart {
  /** What the part describes, so a chip can pick an icon. */
  kind: "car" | "place" | "filter";
  text: string;
}

/** The search's filters, one human-readable part each, in a fixed order. */
export function summaryParts(f: SearchFilters, dict: Dict, lang: Locale): SummaryPart[] {
  const num = (n: number) => formatNumber(n, lang);
  const make = findMake(f.makeId);
  const model = findModel(f.makeId, f.modelId);
  const city = findCity(f.cityId);
  const filters = [
    range(f.yearFrom, f.yearTo, String, dict.summary.upTo),
    range(f.priceFrom, f.priceTo, (n) => `€${num(n)}`, dict.summary.upTo),
    f.mileageTo ? t(dict.summary.upTo, { v: `${num(f.mileageTo)} ${dict.summary.km}` }) : undefined,
    f.powerFromKw ? `${f.powerFromKw}+ kW` : undefined,
    f.fuel?.length ? f.fuel.map((x) => dict.fuel[x]).join("/") : undefined,
    f.gearbox ? dict.gearbox[f.gearbox] : undefined,
    f.body?.length ? f.body.map((x) => dict.body[x]).join("/") : undefined,
    f.seller ? dict.seller[f.seller] : undefined,
    f.sort ? dict.sort[f.sort] : undefined,
  ];
  return [
    { kind: "car" as const, text: make ? [make.name, model?.name].filter(Boolean).join(" ") : dict.summary.anyCar },
    ...filters.filter((x): x is string => Boolean(x)).map((text) => ({ kind: "filter" as const, text })),
    ...(city ? [{ kind: "place" as const, text: t(dict.summary.within, { city: city.name, radius: f.radiusKm }) }] : []),
  ];
}

/** One-line human summary: "BMW 3 Series · 2016–2021 · €8,000–25,000 · up to 150,000 km · Ljubljana +400 km" */
export function summarize(f: SearchFilters, dict: Dict, lang: Locale): string {
  return summaryParts(f, dict, lang).map((p) => p.text).join(" · ");
}
