// Verified by hand (2026-10-21, from a URL mobile.de built itself): location (cn, gn, ll, rd),
// ms=<make>;<model>, fr, ft=DIESEL, ml, tr=AUTOMATIC_GEAR, c=OffRoad, sb=p&od=up.
// Everything else is from memory; check by hand (docs/sites/mobilede.md).
// Note: make-only ms=<make>;;; was dropped by mobile.de in a test, so make-only may not apply.
import type { City } from "@/data/cities";
import type { Body, Fuel, Sort } from "@/lib/filters";
import { bestAnchor, snapUp } from "@/lib/geo";
import ids from "./mobilede-ids.json";
import type { SiteAdapter } from "./types";

const BASE = "https://suchen.mobile.de/fahrzeuge/search.html";

// mobile.de make and model ids, generated from mobile.de's reference lists by scripts/mobilede/ids.ts.
// Model ids verified by hand: volkswagen-touareg (36), kia-sorento (24). Unmapped models fall back to make only.
// `groups` (BMW "3er Reihe", Mercedes "C-Klasse", VW "Passat" with Variant…) aren't used until we know how a
// search link carries a group; those models show as "not applied" meanwhile.
export const MAKE_IDS: Record<string, string> = ids.makes;
export const MODEL_IDS: Record<string, string> = ids.models;

export const FUEL: Record<Fuel, string> = {
  petrol: "PETROL", diesel: "DIESEL", electric: "ELECTRICITY", lpg: "LPG", cng: "CNG",
  hybrid: "HYBRID", plugin_hybrid: "HYBRID",
};

const BODY: Record<Body, string> = {
  sedan: "Limousine", estate: "EstateCar", hatchback: "SmallCar", suv: "OffRoad",
  coupe: "SportsCar", convertible: "Cabrio", van: "Van", mpv: "Van",
};

// [sb, od]; newest verified by hand.
const SORT: Record<Sort, [string, string]> = {
  newest: ["doc", "down"], price_asc: ["p", "up"], price_desc: ["p", "down"],
  mileage_asc: ["ml", "up"], year_desc: ["fr", "down"],
};

const RADII = [50, 100, 150, 200] as const;

export const mobilede: SiteAdapter = {
  id: "mobilede",
  name: "mobile.de",
  countries: ["DE"],
  location: "approximate",
  supports: [
    "makeId", "modelId", "yearFrom", "yearTo", "priceFrom", "priceTo", "mileageTo",
    "powerFromKw", "fuel", "gearbox", "body", "seller", "sort",
  ],
  build(f, { city, radiusKm }) {
    const [sb, od] = SORT[f.sort ?? "newest"];
    const q = new URLSearchParams({ isSearchRequest: "true", s: "Car", vc: "Car", dam: "false", sb, od });
    const skipped: ("makeId" | "modelId")[] = [];
    const makeId = f.makeId ? MAKE_IDS[f.makeId] : undefined;
    if (f.makeId && !makeId) skipped.push("makeId");
    else if (makeId) {
      const modelId = f.modelId ? MODEL_IDS[f.modelId] : undefined;
      q.set("ms", modelId ? `${makeId};${modelId}` : `${makeId};;;`);
      if (f.modelId && !modelId) skipped.push("modelId");
    }
    if (f.yearFrom || f.yearTo) q.set("fr", `${f.yearFrom ?? ""}:${f.yearTo ?? ""}`);
    if (f.priceFrom || f.priceTo) q.set("p", `${f.priceFrom ?? ""}:${f.priceTo ?? ""}`);
    if (f.mileageTo) q.set("ml", `:${f.mileageTo}`);
    if (f.powerFromKw) q.set("pw", `${f.powerFromKw}:`);
    for (const fuel of new Set(f.fuel?.map((x) => FUEL[x]))) q.append("ft", fuel);
    if (f.gearbox) q.set("tr", f.gearbox === "manual" ? "MANUAL_GEAR" : "AUTOMATIC_GEAR");
    for (const body of new Set(f.body?.map((b) => BODY[b]))) q.append("c", body);
    if (f.seller) q.set("st", f.seller === "dealer" ? "DEALER" : "FSBO");

    // Listings in Germany only; mobile.de also has dealers abroad.
    q.set("cn", "DE");

    // The radius search takes coordinates (ll) and km (rd); gn is the label mobile.de shows
    // for the place ("83022, Rosenheim, Bayern" when picked on the site).
    const link = (place: City, r: number): string => {
      const lq = new URLSearchParams(q);
      lq.set("gn", `${place.postcode}, ${place.name}`);
      lq.set("ll", `${place.lat},${place.lon}`);
      lq.set("rd", String(r));
      return `${BASE}?${lq}`;
    };

    const maxRadius = RADII[RADII.length - 1];
    if (city.country === "DE" && radiusKm <= maxRadius) {
      // The user is in Germany: one exact search.
      return { links: [{ url: link(city, snapUp(radiusKm, RADII)) }], skipped, location: "exact" };
    }
    // The user is elsewhere (or the circle is wider than mobile.de allows): one search around the
    // German place that best matches the circle, or all of Germany.
    const { place, radiusKm: r } = bestAnchor(city, radiusKm, "DE", RADII);
    if (!place || !r) return { links: [{ url: `${BASE}?${q}` }], skipped, location: "country" };
    return { links: [{ url: link(place, r), anchor: { city: place.name, radiusKm: r } }], skipped };
  },
};
