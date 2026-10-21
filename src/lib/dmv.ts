// Slovenian motor vehicle tax (davek na motorna vozila, DMV) for passenger cars.
// Source: ZDMV-1, Uradni list RS 192/2020, in force since 1 Jan 2021, articles 9–16.
// The tables below are copied from the law; see docs/IMPORT-COST.md before changing them.

import type { Fuel } from "./filters";

/** Which of the law's scales applies. Hybrids, LPG and CNG use the petrol scale (art. 10(3), 14(2)). */
export type DmvScale = "petrol" | "diesel" | "electric";

export const dmvScale = (fuel: Fuel): DmvScale => (fuel === "diesel" ? "diesel" : fuel === "electric" ? "electric" : "petrol");

export const EURO_NORMS = ["3", "4", "5", "6", "6c", "6d-temp", "6d", "6+"] as const;
export type EuroNorm = (typeof EURO_NORMS)[number];

// Art. 10(1): [surcharge per g/km above the band's lower limit, minimum €].
const CO2_BANDS: { above: number; petrol: [number, number]; diesel: [number, number] }[] = [
  { above: 50, petrol: [0.4, 0], diesel: [0.5, 0] },
  { above: 100, petrol: [0.7, 20], diesel: [0.8, 25] },
  { above: 140, petrol: [5, 48], diesel: [6, 57] },
  { above: 190, petrol: [30, 298], diesel: [36, 357] },
  { above: 230, petrol: [50, 1498], diesel: [60, 1797] },
];

// Art. 14(1). "6d-temp" isn't named in the law; we use the 6c amount (the higher, safer estimate).
const EURO_AMOUNTS: Record<EuroNorm, { petrol: number; diesel: number }> = {
  "3": { petrol: 500, diesel: 1000 },
  "4": { petrol: 400, diesel: 800 },
  "5": { petrol: 150, diesel: 225 },
  "6": { petrol: 75, diesel: 112 },
  "6c": { petrol: 50, diesel: 75 },
  "6d-temp": { petrol: 50, diesel: 75 },
  "6d": { petrol: 30, diesel: 45 },
  "6+": { petrol: 10, diesel: 15 },
};

// Art. 16(1): share of the tax payable by age since first registration: up to 1 year, over 1 year, … over 10 years.
const AGE_SHARES = [0.91, 0.83, 0.76, 0.7, 0.64, 0.58, 0.53, 0.48, 0.43, 0.38, 0.33];

/** Art. 11: NEDC → WLTP, rounded to the nearest g/km. */
export const nedcToWltp = (nedc: number, scale: DmvScale) => Math.round(nedc * (scale === "diesel" ? 1.2 : 1.22));

export function co2Obligation(wltp: number | undefined, scale: Exclude<DmvScale, "electric">): number {
  const top = CO2_BANDS[CO2_BANDS.length - 1][scale][1];
  // Art. 10(4): no CO2 figure at all → 1.5 × the top band's minimum.
  if (wltp === undefined) return top * 1.5;
  // Art. 10(2): up to 50 g/km is free.
  const band = CO2_BANDS.findLast((b) => wltp > b.above);
  if (!band) return 0;
  const [perGram, min] = band[scale];
  return min + perGram * (wltp - band.above);
}

/** Art. 14(4): a missing Euro norm counts as Euro 0. */
export const euroObligation = (euro: EuroNorm | undefined, scale: Exclude<DmvScale, "electric">) =>
  EURO_AMOUNTS[euro ?? "3"][scale];

/** Completed years since first registration, in the law's sense ("over N years"). 0 means "up to 1 year". */
export function yearsOver(firstRegistration: Date, at: Date): number {
  let n = 0;
  while (n < 10) {
    const anniversary = new Date(firstRegistration);
    anniversary.setFullYear(anniversary.getFullYear() + n + 1);
    if (at > anniversary) n++;
    else break;
  }
  return n;
}

export const ageShare = (firstRegistration: Date | undefined, at: Date) =>
  firstRegistration ? AGE_SHARES[yearsOver(firstRegistration, at)] : 1;

export interface DmvInput {
  fuel: Fuel;
  /** Overrides the scale `fuel` implies: a diesel (mild) hybrid pays the diesel scale. */
  scale?: DmvScale;
  /** g/km; undefined when the seller doesn't know it. */
  co2?: number;
  cycle: "wltp" | "nedc";
  euro?: EuroNorm;
  /** undefined for a new car that was never registered. */
  firstRegistration?: Date;
  /** At least seven seats besides the driver's (art. 15(1)). */
  eightPlusSeats: boolean;
  /** When the tax is due; today unless testing. */
  at?: Date;
}

export interface DmvResult {
  co2Wltp?: number;
  co2Part: number;
  euroPart: number;
  /** Share payable for a used car (1 for a new one). */
  ageShare: number;
  yearsOver?: number;
  seatsReduction: boolean;
  total: number;
}

export function calculateDmv(input: DmvInput): DmvResult {
  const at = input.at ?? new Date();
  const scale = input.scale ?? dmvScale(input.fuel);
  const share = ageShare(input.firstRegistration, at);
  const years = input.firstRegistration ? yearsOver(input.firstRegistration, at) : undefined;
  // Art. 12: fully electric cars pay nothing.
  if (scale === "electric") {
    return { co2Part: 0, euroPart: 0, ageShare: share, yearsOver: years, seatsReduction: input.eightPlusSeats, total: 0 };
  }
  const co2Wltp =
    input.co2 === undefined ? undefined : input.cycle === "nedc" ? nedcToWltp(input.co2, scale) : input.co2;
  const co2Part = co2Obligation(co2Wltp, scale);
  const euroPart = euroObligation(input.euro, scale);
  const reduction = input.eightPlusSeats ? 0.7 : 1;
  const total = Math.round((co2Part + euroPart) * reduction * share * 100) / 100;
  return { co2Wltp, co2Part, euroPart, ageShare: share, yearsOver: years, seatsReduction: input.eightPlusSeats, total };
}
