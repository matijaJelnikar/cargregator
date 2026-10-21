// Make/model path and sort=cheap verified by hand (/auti/vw-touareg); the rest is from memory (docs/sites/njuskalo.md).
import { findMake, findModel, modelSlug } from "@/data/makes";
import type { Sort } from "@/lib/filters";
import type { SiteAdapter } from "./types";

const BASE = "https://www.njuskalo.hr/auti";

// Unmapped orders fall back to newest.
const SORT: Partial<Record<Sort, string>> = { newest: "new", price_asc: "cheap", price_desc: "expensive" };

// Makes whose Njuškalo slug isn't simply our own id.
const MAKE_SLUGS: Record<string, string> = {
  volkswagen: "vw",
};

export const njuskalo: SiteAdapter = {
  id: "njuskalo",
  name: "Njuškalo",
  countries: ["HR"],
  location: "country",
  supports: ["makeId", "modelId", "yearFrom", "yearTo", "priceFrom", "priceTo", "mileageTo", "sort"],
  build(f) {
    const make = findMake(f.makeId);
    const model = findModel(f.makeId, f.modelId);
    // Path is /auti/<make>-<model>; English series names ("3 Series") have no Njuškalo slug.
    let path = BASE;
    if (make) {
      path += `/${MAKE_SLUGS[make.id] ?? make.id}`;
      if (model && !model.series) path += `-${modelSlug(make.id, model.id)}`;
    }
    const sort = SORT[f.sort ?? "newest"];
    const q = new URLSearchParams({ sort: sort ?? SORT.newest! });
    if (f.priceFrom) q.set("price[min]", String(f.priceFrom));
    if (f.priceTo) q.set("price[max]", String(f.priceTo));
    if (f.yearFrom) q.set("yearManufactured[min]", String(f.yearFrom));
    if (f.yearTo) q.set("yearManufactured[max]", String(f.yearTo));
    if (f.mileageTo) q.set("mileage[max]", String(f.mileageTo));
    return {
      links: [{ url: `${path}?${q}` }],
      skipped: [...(model?.series ? ["modelId" as const] : []), ...(sort ? [] : ["sort" as const])],
    };
  },
};
