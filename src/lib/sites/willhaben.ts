// UNVERIFIED: parameter names are from memory; check by hand (docs/sites/willhaben.md).
import { findMake, findModel } from "@/data/makes";
import type { Sort } from "@/lib/filters";
import type { SiteAdapter } from "./types";

const BASE = "https://www.willhaben.at/iad/gebrauchtwagen/auto/gebrauchtwagenboerse";

// Unmapped orders fall back to newest.
const SORT: Partial<Record<Sort, string>> = { newest: "1", price_asc: "3", price_desc: "4" };

export const willhaben: SiteAdapter = {
  id: "willhaben",
  name: "willhaben",
  countries: ["AT"],
  location: "country",
  supports: ["makeId", "modelId", "yearFrom", "yearTo", "priceFrom", "priceTo", "mileageTo", "sort"],
  build(f) {
    const sort = SORT[f.sort ?? "newest"];
    const q = new URLSearchParams({ sort: sort ?? SORT.newest! });
    const model = findModel(f.makeId, f.modelId);
    const keyword = [findMake(f.makeId)?.name, model?.series ? undefined : model?.name].filter(Boolean).join(" ");
    if (keyword) q.set("keyword", keyword);
    if (f.priceFrom) q.set("PRICE_FROM", String(f.priceFrom));
    if (f.priceTo) q.set("PRICE_TO", String(f.priceTo));
    if (f.yearFrom) q.set("YEAR_MODEL_FROM", String(f.yearFrom));
    if (f.yearTo) q.set("YEAR_MODEL_TO", String(f.yearTo));
    if (f.mileageTo) q.set("MILEAGE_TO", String(f.mileageTo));
    return { links: [{ url: `${BASE}?${q}` }], keyword: Boolean(keyword), skipped: [...(model?.series ? ["modelId" as const] : []), ...(sort ? [] : ["sort" as const])] };
  },
};
