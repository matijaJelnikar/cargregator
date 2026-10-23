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

// Written reports (scripts/carinfo/report.ts): one per generation, researched with web search. -----------------

/** Same values as the carinfo enums in the schema migration. */
export const AREAS = ["engine", "gearbox", "electrics", "suspension", "body", "emissions"] as const;
export const LIKELIHOODS = ["low", "med", "high"] as const;
export const VERDICTS = ["recommended", "ok", "avoid"] as const;
export const LINK_KINDS = ["test", "safety", "reliability", "review", "forum", "other"] as const;

const Text = z.object({ sl: z.string().min(1), en: z.string().min(1) });
const Source = z.object({ url: z.url(), title: z.string().min(1) });
const Eur = z.number().int().min(0).max(100_000);

export const ReportAnswer = z.object({
  /** 2–4 sentences: what the car is, who it suits, how it has aged. */
  summary: Text,
  pros: z.array(Text).min(2).max(6),
  cons: z.array(Text).min(2).max(6),
  /** One entry per engine name from the prompt ("1.4 TSI"); applies to every power output of that name. */
  engines: z.array(
    z.object({
      name: z.string().min(1),
      verdict: z.enum(VERDICTS),
      score: z.number().int().min(1).max(10),
      /** Typical yearly service and repair spend in EUR, fuel and insurance excluded. */
      annual_cost_min: Eur.nullable(),
      annual_cost_max: Eur.nullable(),
      summary: Text,
    }),
  ),
  failures: z.array(
    z.object({
      area: z.enum(AREAS),
      /** An engine name from the prompt when the problem is specific to it, else null. */
      engine: z.string().nullable(),
      title: Text,
      body: Text,
      symptoms: Text,
      year_from: year.nullable(),
      year_to: year.nullable(),
      likelihood: z.enum(LIKELIHOODS),
      cost_min: Eur.nullable(),
      cost_max: Eur.nullable(),
      sources: z.array(Source).min(1),
    }),
  ),
  /** What to check on a viewing or test drive, most important first. */
  checks: z.array(Text).min(3).max(10),
  links: z.array(z.object({ kind: z.enum(LINK_KINDS), title: z.string().min(1), url: z.url() })),
  ncap: z.object({ stars: z.number().int().min(0).max(5), year: year, url: z.url() }).nullable(),
  /** 0–1: how well the sources covered this generation. */
  confidence: z.number().min(0).max(1),
});
export type ReportAnswer = z.infer<typeof ReportAnswer>;

/** The check pass (scripts/carinfo/verify.ts): one verdict per failure, by index, after reading its sources. */
export const VerifyAnswer = z.object({
  failures: z.array(z.object({ index: z.number().int().min(0), check: z.enum(["supported", "weak", "unsupported"]), note: z.string() })),
  /** Links and the NCAP page that did not load or are about another car. */
  bad_urls: z.array(z.string()),
  /** Statements in summary/pros/cons/engines that sources contradict or that are wrong for this generation. */
  errors: z.array(z.object({ claim: z.string(), fix: z.string() })),
  /** Plausible statements the cited sources just don't cover (informational, not blocking). */
  unsourced: z.array(z.string()),
});
export type VerifyAnswer = z.infer<typeof VerifyAnswer>;

/** The correction pass: the report's prose with the checker's errors fixed. */
export const ReportFix = ReportAnswer.pick({ summary: true, pros: true, cons: true, engines: true });
export type ReportFix = z.infer<typeof ReportFix>;
