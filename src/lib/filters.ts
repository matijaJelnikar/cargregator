import { z } from "zod";
import { DEFAULT_CITY_ID } from "@/data/cities";

export const FUELS = ["petrol", "diesel", "hybrid", "plugin_hybrid", "electric", "lpg", "cng"] as const;
export const GEARBOXES = ["manual", "automatic"] as const;
export const BODIES = ["sedan", "estate", "hatchback", "suv", "coupe", "convertible", "van", "mpv"] as const;
export const SELLERS = ["dealer", "private"] as const;
/** "newest" is the default and is never stored. */
export const SORTS = ["newest", "price_asc", "price_desc", "mileage_asc", "year_desc"] as const;
export const SITE_IDS = ["avtonet", "mobilede", "autoscout24", "willhaben", "njuskalo"] as const;

export const RADIUS_MIN = 25;
export const RADIUS_MAX = 1000;
export const RADIUS_STEP = 25;
export const DEFAULT_RADIUS = 300;

export type Fuel = (typeof FUELS)[number];
export type Gearbox = (typeof GEARBOXES)[number];
export type Body = (typeof BODIES)[number];
export type Seller = (typeof SELLERS)[number];
export type Sort = (typeof SORTS)[number];
export type SiteId = (typeof SITE_IDS)[number];

const int = (min: number, max: number) => z.coerce.number().int().min(min).max(max);

export const searchFiltersSchema = z.object({
  makeId: z.string().max(40).optional(),
  modelId: z.string().max(60).optional(),
  yearFrom: int(1950, 2100).optional(),
  yearTo: int(1950, 2100).optional(),
  priceFrom: int(0, 10_000_000).optional(),
  priceTo: int(0, 10_000_000).optional(),
  mileageTo: int(0, 2_000_000).optional(),
  powerFromKw: int(0, 2000).optional(),
  fuel: z.array(z.enum(FUELS)).optional(),
  gearbox: z.enum(GEARBOXES).optional(),
  body: z.array(z.enum(BODIES)).optional(),
  seller: z.enum(SELLERS).optional(),
  sort: z.enum(SORTS).optional(),
  cityId: z.string().max(60).optional(),
  radiusKm: int(RADIUS_MIN, RADIUS_MAX),
  sites: z.array(z.enum(SITE_IDS)),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;
export type FilterKey = Exclude<keyof SearchFilters, "cityId" | "radiusKm" | "sites">;

export const DEFAULT_FILTERS: SearchFilters = {
  cityId: DEFAULT_CITY_ID,
  radiusKm: DEFAULT_RADIUS,
  sites: [...SITE_IDS],
};

// Short query-string keys keep shared links readable.
const SCALAR_KEYS = {
  makeId: "make",
  modelId: "model",
  yearFrom: "yf",
  yearTo: "yt",
  priceFrom: "pf",
  priceTo: "pt",
  mileageTo: "km",
  powerFromKw: "kw",
  gearbox: "gear",
  seller: "seller",
  sort: "sort",
  cityId: "city",
  radiusKm: "r",
} as const satisfies Partial<Record<keyof SearchFilters, string>>;

const LIST_KEYS = { fuel: "fuel", body: "body", sites: "sites" } as const;

export function toQuery(f: SearchFilters): string {
  const q = new URLSearchParams();
  for (const [key, param] of Object.entries(SCALAR_KEYS)) {
    const v = f[key as keyof typeof SCALAR_KEYS];
    if (v !== undefined && v !== "") q.set(param, String(v));
  }
  for (const [key, param] of Object.entries(LIST_KEYS)) {
    const v = f[key as keyof typeof LIST_KEYS];
    if (v && v.length) q.set(param, v.join(","));
  }
  return q.toString();
}

/** Parses a query string; invalid or unknown values are dropped instead of failing the whole search. */
export function fromQuery(input: string | URLSearchParams): SearchFilters {
  const q = typeof input === "string" ? new URLSearchParams(input) : input;
  const raw: Record<string, unknown> = {};
  for (const [key, param] of Object.entries(SCALAR_KEYS)) {
    const v = q.get(param);
    if (v) raw[key] = v;
  }
  for (const [key, param] of Object.entries(LIST_KEYS)) {
    const v = q.get(param);
    if (v !== null) raw[key] = v.split(",").filter(Boolean);
  }
  return sanitize(raw);
}

const LIST_ITEMS = { fuel: z.enum(FUELS), body: z.enum(BODIES), sites: z.enum(SITE_IDS) } as const;

/** Validates field by field so one bad value (e.g. an old site id) doesn't discard the rest. */
export function sanitize(raw: Record<string, unknown>): SearchFilters {
  const shape = searchFiltersSchema.shape;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(shape) as (keyof typeof shape)[]) {
    let value = raw[key];
    if (value === undefined) continue;
    if (Array.isArray(value) && key in LIST_ITEMS) {
      const item = LIST_ITEMS[key as keyof typeof LIST_ITEMS];
      value = value.filter((v) => item.safeParse(v).success);
    }
    const parsed = shape[key].safeParse(value);
    if (parsed.success) out[key] = parsed.data;
  }
  return {
    ...out,
    cityId: (out.cityId as string | undefined) ?? DEFAULT_FILTERS.cityId,
    radiusKm: (out.radiusKm as number | undefined) ?? DEFAULT_RADIUS,
    sites: (out.sites as SiteId[] | undefined) ?? [...SITE_IDS],
  };
}

export const KW_PER_HP = 0.7355;
export const hpToKw = (hp: number) => Math.round(hp * KW_PER_HP);
export const kwToHp = (kw: number) => Math.round(kw / KW_PER_HP);
