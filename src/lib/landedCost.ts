// Landed cost of a car bought in another EU country and registered in Slovenia, for a private buyer.

import { calculateDmv, type DmvInput, type DmvResult } from "./dmv";

export const SI_VAT = 0.22;

/** Standard VAT rates of the countries the app searches (outside Slovenia). */
export const SELLER_VAT = {
  DE: 0.19, AT: 0.2, HR: 0.25, IT: 0.22, HU: 0.27, BE: 0.21, NL: 0.21, LU: 0.17, FR: 0.2, ES: 0.21,
} as const;
export type SellerCountry = keyof typeof SELLER_VAT;
export const SELLER_COUNTRIES = Object.keys(SELLER_VAT) as SellerCountry[];

/** Editable defaults; rough estimates, not taken from any tariff. */
export const DEFAULT_TRANSPORT = 250;
export const DEFAULT_REGISTRATION = 250;

/**
 * EU VAT rule (Directive 2006/112/EC, art. 2(2)(b)): a car is a "new means of transport" if it was first
 * registered no more than 6 months ago or has driven no more than 6,000 km. Its VAT is then due in
 * Slovenia (22 %) instead of the seller's country, whoever sells it.
 */
export function isNewForVat(firstRegistration: Date | undefined, km: number | undefined, at: Date): boolean {
  if (!firstRegistration) return true;
  const sixMonthsLater = new Date(firstRegistration);
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
  return at <= sixMonthsLater || (km !== undefined && km <= 6000);
}

export interface LandedCostInput extends DmvInput {
  /** Asking price in EUR as listed. */
  price: number;
  sellerCountry: SellerCountry;
  /** Listing says VAT is shown ("MwSt. ausweisbar", "DDV se lahko odbije"). */
  vatShown: boolean;
  km?: number;
  transport: number;
  registration: number;
}

export interface LandedCost {
  /** What you pay the seller. */
  carPrice: number;
  newForVat: boolean;
  siVat: number;
  dmv: DmvResult;
  transport: number;
  registration: number;
  total: number;
}

export function calculateLandedCost(input: LandedCostInput): LandedCost {
  const at = input.at ?? new Date();
  const newForVat = isNewForVat(input.firstRegistration, input.km, at);
  // A "new" car is sold net and taxed here; a used one is paid as listed, its VAT settled in the seller's country.
  const carPrice = newForVat && input.vatShown ? input.price / (1 + SELLER_VAT[input.sellerCountry]) : input.price;
  const siVat = newForVat ? carPrice * SI_VAT : 0;
  const dmv = calculateDmv({ ...input, at });
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    carPrice: round(carPrice),
    newForVat,
    siVat: round(siVat),
    dmv,
    transport: input.transport,
    registration: input.registration,
    total: round(carPrice + siVat + dmv.total + input.transport + input.registration),
  };
}
