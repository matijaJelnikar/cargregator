// Car info ("avto poročila"): generations and engines per model, stored in Supabase (schema carinfo).
// Shared by the offline scripts in scripts/carinfo and the pages. Only type imports from other src files:
// the scripts load this file with plain node.

import { z } from "zod";
import type { Fuel } from "./filters";

/** Same values as FUELS in filters.ts (checked in carinfo.test.ts). */
export const CARINFO_FUELS = ["petrol", "diesel", "hybrid", "plugin_hybrid", "electric", "lpg", "cng"] as const satisfies readonly Fuel[];

/** A variant id from the skeleton prompt ("v12"), optionally limited to some years ("v12@2012-2016"). */
const VARIANT = /^v\d+(@\d{4}-\d{4})?$/;

const year = z.number().int().min(1950).max(2030);

/** One generation of a model, as in both skeleton answer kinds. */
const Generation = z.object({
  /** "mk7", "e90", "w205": short, lowercase, as enthusiasts write it. */
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  /** As buyers know it: "Golf VII", "3 Series (F30)". */
  name: z.string().min(1),
  /** Maker's chassis/platform code ("5G", "F30"), null if none is commonly used. */
  code: z.string().nullable(),
  /** Production years of the generation (facelift included), not just the years in the data. */
  year_from: year,
  year_to: year.nullable(),
  /** EEA type codes that belong to this generation. */
  types: z.array(z.string()),
});

/** The model's answer to a skeleton prompt (scripts/carinfo/skeleton-prompt.ts). */
export const SkeletonAnswer = z.object({
  generations: z.array(Generation).min(1),
  engines: z.array(
    z.object({
      generation: z.string(),
      /** "1.4 TSI", "320d", "2.0 TDI 4MOTION", "GTI". Power is shown separately. */
      name: z.string().min(1),
      /** Engine family code if well known ("EA211", "B47", "K9K"), else null. */
      engine_code: z.string().nullable(),
      variants: z.array(z.string().regex(VARIANT)).min(1),
    }),
  ),
  dropped: z.array(z.object({ variant: z.string().regex(VARIANT), reason: z.string() })),
});
export type SkeletonAnswer = z.infer<typeof SkeletonAnswer>;

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** "1.4 TSI" at 92 kW → "1-4-tsi-92kw"; electric motors have no displacement, so kW keeps slugs unique. */
export function engineSlug(name: string, kw: number): string {
  return `${slugify(name)}-${kw}kw`;
}

const FuelEnum = z.enum(CARINFO_FUELS);

/** The model's answer to a knowledge-only prompt (scripts/carinfo/knowledge.ts), for models without EEA data. */
export const KnowledgeAnswer = z.object({
  generations: z.array(Generation.omit({ types: true })).min(1),
  engines: z.array(
    z.object({
      generation: z.string(),
      name: z.string().min(1),
      engine_code: z.string().nullable(),
      fuel: FuelEnum,
      kw: z.number().int().min(10).max(1000),
      /** Displacement in cc, null for electric motors. */
      ccm: z.number().int().min(100).max(10000).nullable(),
      year_from: year,
      year_to: year,
    }),
  ),
});
export type KnowledgeAnswer = z.infer<typeof KnowledgeAnswer>;
