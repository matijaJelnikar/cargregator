// What the user enters about one car on the import page, and what it costs on Slovenian plates.
// The user types what the listing shows (price, registration, km, power); CO2 and the Euro norm are filled in
// from EU registration data (co2.ts) unless the user overrides them.

import { euroByRegistration, lookupCo2, WLTP_FROM, type Co2Data, type Co2Match } from "./co2";
import type { DmvScale, EuroNorm } from "./dmv";
import type { Fuel, SearchFilters } from "./filters";
import {
  DEFAULT_REGISTRATION, DEFAULT_TRANSPORT, SELLER_COUNTRIES, calculateLandedCost, type LandedCost, type SellerCountry,
} from "./landedCost";
import type { ListingInfo } from "./listing";

/** "SI" = the car is already in Slovenia: nothing to import. */
export type CarCountry = SellerCountry | "SI";

export interface CarInput {
  price?: number;
  country: CarCountry;
  vatShown: boolean;
  isNew: boolean;
  regMonth?: number;
  regYear?: number;
  km?: number;
  makeId?: string;
  modelId?: string;
  fuel: Fuel;
  /** Engine power as listed, kW. */
  kw?: number;
  // Overrides of the automatic values; undefined (or "") means automatic.
  co2?: number;
  co2Unknown: boolean;
  cycle?: "wltp" | "nedc";
  euro: EuroNorm | "unknown" | "";
  /** Hybrid with a diesel engine: pays the diesel DMV scale. */
  dieselHybrid?: boolean;
  eightPlusSeats: boolean;
  transport?: number;
  registration?: number;
}

export type MissingKey = "price" | "firstReg" | "co2" | "euro";

export type CarResult =
  | { kind: "missing"; missing: MissingKey[] }
  | { kind: "domestic"; total: number }
  | { kind: "import"; cost: LandedCost };

export const isHybrid = (fuel: Fuel) => fuel === "hybrid" || fuel === "plugin_hybrid";

const isCarCountry = (c: string | undefined): c is CarCountry =>
  c === "SI" || (SELLER_COUNTRIES as string[]).includes(c ?? "");

/** The middle of a range filter, or whichever end is set. */
const middle = (from?: number, to?: number) => (from !== undefined && to !== undefined ? (from + to) / 2 : (from ?? to));

/**
 * Prefills what the search and the shared link already know; the link wins. Without a link, the search's ranges
 * stand in for the car (mid-range price and year, top mileage, minimum power) so there is an estimate right away.
 */
export function initialCarInput(filters: SearchFilters, listing?: ListingInfo | null): CarInput {
  const fromLink = Boolean(listing?.makeId);
  const estimate = !listing;
  const price = estimate ? middle(filters.priceFrom, filters.priceTo) : listing.price;
  const year = estimate
    ? middle(filters.yearFrom, filters.yearTo)
    : filters.yearFrom && filters.yearFrom === filters.yearTo ? filters.yearFrom : undefined;
  const regYear = year === undefined ? undefined : Math.round(year);
  return {
    price: price === undefined ? undefined : Math.round(price / 100) * 100,
    country: isCarCountry(listing?.country) ? listing.country : "DE",
    vatShown: false,
    isNew: false,
    // Mid-year, as the automatic values assume when only the year is known.
    regMonth: estimate && regYear ? 7 : undefined,
    regYear,
    km: estimate ? filters.mileageTo : undefined,
    kw: estimate ? filters.powerFromKw : undefined,
    makeId: fromLink ? listing!.makeId : filters.makeId,
    modelId: fromLink ? listing!.modelId : filters.modelId,
    fuel: listing?.fuel ?? (filters.fuel?.length === 1 ? filters.fuel[0] : "petrol"),
    co2Unknown: false,
    euro: "",
    eightPlusSeats: false,
    transport: DEFAULT_TRANSPORT,
    registration: DEFAULT_REGISTRATION,
  };
}

/** A link added later: what it tells about the car replaces what is entered, as when the form opens from it. */
export function withListing(s: CarInput, listing: ListingInfo): CarInput {
  return {
    ...s,
    ...(isCarCountry(listing.country) ? { country: listing.country } : {}),
    ...(listing.makeId ? { makeId: listing.makeId, modelId: listing.modelId } : {}),
    ...(listing.fuel ? { fuel: listing.fuel } : {}),
    ...(listing.price !== undefined ? { price: listing.price } : {}),
  };
}

/** undefined = new car; null = not filled in yet. */
export function firstRegistration(s: CarInput): Date | undefined | null {
  return s.isNew ? undefined : s.regYear && s.regMonth ? new Date(s.regYear, s.regMonth - 1, 1) : null;
}

/** The date the automatic values go by: mid-year when only the year is known; null when there is none yet. */
function emissionDate(s: CarInput, now: Date): Date | null {
  if (s.isNew) return now;
  return s.regYear ? new Date(s.regYear, (s.regMonth ?? 7) - 1, 1) : null;
}

/** The EU registration figures for the car's model, fuel and power; undefined when we can't tell. */
export function findCo2(s: CarInput, data: Co2Data | undefined, now: Date): Co2Match | undefined {
  const at = emissionDate(s, now);
  if (!data || !s.modelId || !s.kw || !at) return undefined;
  return lookupCo2(data[s.modelId], { fuel: s.fuel, kw: s.kw, firstReg: s.isNew ? undefined : at, now });
}

/** True when the user typed CO2 or said it isn't listed. */
export const co2Overridden = (s: CarInput) => s.co2 !== undefined || s.co2Unknown;

/** The input with the automatic values filled in where the user didn't set them. */
export function resolveCar(s: CarInput, auto: Co2Match | undefined, now: Date): CarInput {
  const at = emissionDate(s, now);
  const overridden = co2Overridden(s);
  const euro = auto?.euro ?? (at ? euroByRegistration(at.getFullYear(), at.getMonth() + 1) : undefined);
  return {
    ...s,
    co2: overridden ? s.co2 : auto?.co2,
    cycle: overridden ? s.cycle : (auto?.cycle ?? s.cycle),
    euro: s.euro || euro || "",
    dieselHybrid: s.dieselHybrid ?? auto?.dieselScale ?? false,
  };
}

export function effectiveCycle(s: CarInput): "wltp" | "nedc" {
  const firstReg = firstRegistration(s);
  return s.cycle ?? (firstReg && firstReg < WLTP_FROM ? "nedc" : "wltp");
}

/** The DMV scale when it differs from what the fuel implies. */
const scaleOverride = (s: CarInput): DmvScale | undefined => (isHybrid(s.fuel) && s.dieselHybrid ? "diesel" : undefined);

/** Expects a resolved input (resolveCar). */
export function evaluateCar(s: CarInput, now: Date): CarResult {
  if (s.country === "SI") {
    return s.price === undefined ? { kind: "missing", missing: ["price"] } : { kind: "domestic", total: s.price };
  }
  const firstReg = firstRegistration(s);
  const electric = s.fuel === "electric";
  const missing = (
    [
      s.price === undefined && "price",
      firstReg === null && "firstReg",
      !electric && s.co2 === undefined && !s.co2Unknown && "co2",
      !electric && s.euro === "" && "euro",
    ] as const
  ).filter((x): x is MissingKey => Boolean(x));
  if (missing.length > 0 || firstReg === null) return { kind: "missing", missing };

  return {
    kind: "import",
    cost: calculateLandedCost({
      price: s.price!,
      sellerCountry: s.country,
      vatShown: s.vatShown,
      km: s.km,
      fuel: s.fuel,
      scale: scaleOverride(s),
      co2: s.co2Unknown ? undefined : s.co2,
      cycle: effectiveCycle(s),
      euro: s.euro === "unknown" || s.euro === "" ? undefined : s.euro,
      firstRegistration: firstReg,
      eightPlusSeats: s.eightPlusSeats,
      transport: s.transport ?? 0,
      registration: s.registration ?? 0,
      at: now,
    }),
  };
}
