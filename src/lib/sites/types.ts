import type { City } from "@/data/cities";
import type { FilterKey, SearchFilters, SiteId } from "@/lib/filters";

export type LocationSupport = "exact" | "approximate" | "country";

export interface LinkContext {
  city: City;
  radiusKm: number;
  /** Countries with at least one bundled city inside the search circle. */
  countriesInRange: Set<string>;
}

export interface SiteLink {
  url: string;
  /** Set when the search is centred on a place we picked: "≈ <radius> km around <city>". */
  anchor?: { city: string; radiusKm: number };
}

export interface BuildResult {
  links: SiteLink[];
  /** Filters the user set that this search couldn't apply beyond `supports` (e.g. unmapped model). */
  skipped?: FilterKey[];
  /** Overrides the adapter's default location support for this search. */
  location?: LocationSupport;
  /** Make/model was sent as a free-text keyword rather than a structured filter. */
  keyword?: boolean;
}

export interface SiteAdapter {
  id: SiteId;
  name: string;
  /** Countries the site's listings are in. */
  countries: string[];
  location: LocationSupport;
  /** Filters this site can apply; everything else the user set shows as "not applied". */
  supports: FilterKey[];
  build(filters: SearchFilters, ctx: LinkContext): BuildResult;
}
