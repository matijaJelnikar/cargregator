// UNVERIFIED: parameter names and codes are from memory; check by hand (docs/sites/autoscout24.md).
import { findMake, modelSlug } from "@/data/makes";
import type { Body, Fuel, Sort } from "@/lib/filters";
import { snapUp } from "@/lib/geo";
import type { SiteAdapter } from "./types";

const BASE = "https://www.autoscout24.com/lst";

// AutoScout24 country codes (cy=…), keyed by ISO code.
const COUNTRY_CODES: Record<string, string> = {
  DE: "D", AT: "A", IT: "I", BE: "B", NL: "NL", FR: "F", ES: "E", LU: "L",
};

const FUEL: Record<Fuel, string[]> = {
  petrol: ["B"], diesel: ["D"], electric: ["E"], lpg: ["L"], cng: ["C"],
  hybrid: ["2", "3"], plugin_hybrid: ["2", "3"],
};

const BODY: Record<Body, string> = {
  hatchback: "1", convertible: "2", coupe: "3", suv: "4", estate: "5", sedan: "6", mpv: "12", van: "13",
};

// [sort, desc]
const SORT: Record<Sort, [string, string]> = {
  newest: ["age", "1"], price_asc: ["price", "0"], price_desc: ["price", "1"],
  mileage_asc: ["mileage", "0"], year_desc: ["year", "1"],
};

const RADII = [50, 100, 150, 200, 250, 300, 400, 500] as const;

// Model lines whose slug isn't simply our own slug.
const MODEL_SLUGS: Record<string, string> = {
  "bmw-1-series": "1-series-(all)",
  "bmw-2-series": "2-series-(all)",
  "bmw-3-series": "3-series-(all)",
  "bmw-4-series": "4-series-(all)",
  "bmw-5-series": "5-series-(all)",
  "mercedes-benz-a-class": "a-class-(all)",
  "mercedes-benz-b-class": "b-class-(all)",
  "mercedes-benz-c-class": "c-class-(all)",
  "mercedes-benz-e-class": "e-class-(all)",
};

export const autoscout24: SiteAdapter = {
  id: "autoscout24",
  name: "AutoScout24",
  countries: Object.keys(COUNTRY_CODES),
  location: "exact",
  supports: [
    "makeId", "modelId", "yearFrom", "yearTo", "priceFrom", "priceTo", "mileageTo",
    "powerFromKw", "fuel", "gearbox", "body", "seller", "sort",
  ],
  build(f, { city, radiusKm, countriesInRange }) {
    let path = BASE;
    const make = findMake(f.makeId);
    if (make) {
      path += `/${make.id}`;
      if (f.modelId) path += `/${MODEL_SLUGS[f.modelId] ?? modelSlug(make.id, f.modelId)}`;
    }

    const [sort, desc] = SORT[f.sort ?? "newest"];
    const q = new URLSearchParams({ atype: "C", sort, desc, ustate: "N,U" });
    const cy = Object.entries(COUNTRY_CODES)
      .filter(([iso]) => countriesInRange.has(iso))
      .map(([, code]) => code);
    q.set("cy", cy.join(","));
    if (f.yearFrom) q.set("fregfrom", String(f.yearFrom));
    if (f.yearTo) q.set("fregto", String(f.yearTo));
    if (f.priceFrom) q.set("pricefrom", String(f.priceFrom));
    if (f.priceTo) q.set("priceto", String(f.priceTo));
    if (f.mileageTo) q.set("kmto", String(f.mileageTo));
    if (f.powerFromKw) {
      q.set("powerfrom", String(f.powerFromKw));
      q.set("powertype", "kw");
    }
    if (f.fuel?.length) q.set("fuel", [...new Set(f.fuel.flatMap((x) => FUEL[x]))].join(","));
    if (f.gearbox) q.set("gear", f.gearbox === "manual" ? "M" : "A");
    if (f.body?.length) q.set("body", f.body.map((b) => BODY[b]).join(","));
    if (f.seller) q.set("custtype", f.seller === "dealer" ? "D" : "P");
    // Beyond the largest radius, the selected countries already limit the search.
    if (radiusKm > RADII[RADII.length - 1]) {
      return { links: [{ url: `${path}?${q}` }], location: "country" };
    }
    q.set("zip", `${city.postcode} ${city.name}`);
    q.set("zipr", String(snapUp(radiusKm, RADII)));
    q.set("lat", String(city.lat));
    q.set("lon", String(city.lon));
    return { links: [{ url: `${path}?${q}` }] };
  },
};
