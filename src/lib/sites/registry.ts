import { DEFAULT_CITY_ID, PLACES, findCity, type City } from "@/data/cities";
import { RADIUS_MAX, RADIUS_STEP, type FilterKey, type SearchFilters, type SiteId } from "@/lib/filters";
import { countriesInCircle, distanceKm } from "@/lib/geo";
import { autoscout24 } from "./autoscout24";
import { avtonet } from "./avtonet";
import { mobilede } from "./mobilede";
import { njuskalo } from "./njuskalo";
import { willhaben } from "./willhaben";
import type { LinkContext, LocationSupport, SiteAdapter, SiteLink } from "./types";

export const SITES: SiteAdapter[] = [avtonet, mobilede, autoscout24, willhaben, njuskalo];

/** The site's market as a short code: its country, or "EU" for a pan-European site. */
export const marketCode = (site: SiteAdapter) => (site.countries.length > 3 ? "EU" : site.countries[0]);

export function findSite(id: SiteId): SiteAdapter {
  return SITES.find((s) => s.id === id)!;
}

export interface SiteResult {
  site: SiteAdapter;
  enabled: boolean;
  inRange: boolean;
  links: SiteLink[];
  location: LocationSupport;
  skipped: FilterKey[];
  keyword: boolean;
}

/** Filters the user actually set (empty lists and unset values don't count). */
export function activeFilterKeys(f: SearchFilters): FilterKey[] {
  const keys: FilterKey[] = [
    "makeId", "modelId", "yearFrom", "yearTo", "priceFrom", "priceTo", "mileageTo",
    "powerFromKw", "fuel", "gearbox", "body", "seller", "sort",
  ];
  return keys.filter((k) => {
    const v = f[k];
    return Array.isArray(v) ? v.length > 0 : v !== undefined && v !== "";
  });
}

export function linkContext(f: SearchFilters): LinkContext {
  const city = findCity(f.cityId) ?? findCity(DEFAULT_CITY_ID)!;
  return { city, radiusKm: f.radiusKm, countriesInRange: countriesInCircle(city, f.radiusKm) };
}

export function isInRange(site: SiteAdapter, ctx: LinkContext): boolean {
  return site.countries.some((c) => ctx.countriesInRange.has(c));
}

/** The smallest radius on the form's slider that brings the site into range; undefined when none does. */
export function radiusToReach(site: SiteAdapter, city: City): number | undefined {
  const nearest = Math.min(...PLACES.filter((p) => site.countries.includes(p.country)).map((p) => distanceKm(city, p)));
  const radius = Math.ceil(nearest / RADIUS_STEP) * RADIUS_STEP;
  return radius <= RADIUS_MAX ? radius : undefined;
}

export function buildResults(f: SearchFilters): SiteResult[] {
  const ctx = linkContext(f);
  const active = activeFilterKeys(f);
  return SITES.map((site) => {
    const enabled = f.sites.includes(site.id);
    const inRange = isInRange(site, ctx);
    if (!enabled || !inRange) {
      return { site, enabled, inRange, links: [], location: site.location, skipped: [], keyword: false };
    }
    const built = site.build(f, ctx);
    const skipped = new Set([...active.filter((k) => !site.supports.includes(k)), ...(built.skipped ?? [])]);
    // Model can't apply without make; don't double-report it.
    if (skipped.has("makeId")) skipped.delete("modelId");
    return {
      site,
      enabled,
      inRange,
      links: built.links,
      location: built.location ?? site.location,
      skipped: active.filter((k) => skipped.has(k)),
      keyword: built.keyword ?? false,
    };
  });
}
