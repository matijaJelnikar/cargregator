"use client";

import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { RecallList, years } from "@/components/RecallList";
import { Eyebrow, Pill } from "@/components/ui";
import { findMake, findModel } from "@/data/makes";
import { modelSlug, type CarGeneration } from "@/lib/carinfoDb";
import { engineFor, generationFor, generationsInRange, recallsFor } from "@/lib/carinfoMatch";
import type { Fuel } from "@/lib/filters";
import { t, type Dict, type Locale } from "@/lib/i18n";
import { useCarInfo } from "@/lib/useCarInfo";

const modelHref = (lang: Locale, makeId: string, modelId: string) => `/${lang}/avti/${makeId}/${modelSlug(makeId, modelId)}/`;

/** One line under the model select: how many generations we know and how many recalls they have. */
export function CarInfoHint({ lang, dict, makeId, modelId }: { lang: Locale; dict: Dict; makeId: string; modelId: string }) {
  const gens = useCarInfo(modelId);
  if (!gens?.length) return null;
  const recalls = gens.reduce((n, g) => n + g.recalls.length, 0);
  return (
    <Link href={modelHref(lang, makeId, modelId)} className="mt-1.5 inline-flex items-center gap-1 text-xs text-accent hover:underline">
      {t(dict.carInfo.generations, { n: gens.length })}
      {recalls > 0 && <> · {t(dict.carInfo.recallCount, { n: recalls })}</>}
      <ArrowRight className="size-3" aria-hidden />
    </Link>
  );
}

/** Results page: the generations that fit the searched years, each with its recall count. */
export function CarInfoCard({
  lang,
  dict,
  makeId,
  modelId,
  yearFrom,
  yearTo,
}: {
  lang: Locale;
  dict: Dict;
  makeId: string;
  modelId: string;
  yearFrom?: number;
  yearTo?: number;
}) {
  const all = useCarInfo(modelId);
  const gens = all ? generationsInRange(all, yearFrom, yearTo) : [];
  if (!gens.length) return null;
  const c = dict.carInfo;
  const name = [findMake(makeId)?.name, findModel(makeId, modelId)?.name].filter(Boolean).join(" ");
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold">
          <BookOpen className="size-[18px] text-accent" strokeWidth={1.75} aria-hidden />
          {name}
        </h2>
        <Link href={modelHref(lang, makeId, modelId)} className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
          {c.openGuide}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
      <ul className="mt-3 divide-y divide-border text-sm">
        {gens.map((g) => (
          <li key={g.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
            <span>
              <span className="font-medium">{g.name}</span> <span className="font-mono text-muted">{years(g.year_from, g.year_to, dict)}</span>
            </span>
            <Pill tone={g.recalls.length ? "warning" : "neutral"} dot>
              {g.recalls.length ? t(c.recallCount, { n: g.recalls.length }) : c.noRecalls}
            </Pill>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Check page: what we know about this exact car (generation, engine, recalls for its year). */
export function CarInfoPanel({
  lang,
  dict,
  makeId,
  modelId,
  year,
  fuel,
  kw,
}: {
  lang: Locale;
  dict: Dict;
  makeId: string;
  modelId: string;
  year?: number;
  fuel?: Fuel;
  kw?: number;
}) {
  const gens = useCarInfo(modelId);
  const gen: CarGeneration | undefined = gens && year !== undefined ? generationFor(gens, year) : undefined;
  if (!gen || year === undefined) return null;
  const c = dict.carInfo;
  const engine = fuel && kw ? engineFor(gen, { fuel, kw, year }) : undefined;
  const recalls = recallsFor(gen, year);
  const href = engine
    ? `/${lang}/avti/${makeId}/${modelSlug(makeId, modelId)}/${gen.slug}/${engine.slug}/`
    : modelHref(lang, makeId, modelId);
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <Eyebrow className="text-accent">{c.panelTitle}</Eyebrow>
      <h2 className="mt-1 font-semibold">
        {gen.name} <span className="font-mono text-sm font-normal text-muted">{years(gen.year_from, gen.year_to, dict)}</span>
      </h2>
      {engine && (
        <p className="mt-0.5 text-sm text-muted">
          {engine.name}, {engine.kw} kW
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <Pill tone={recalls.length ? "warning" : "neutral"} dot>
          {recalls.length ? t(c.recallCount, { n: recalls.length }) : c.noRecalls}
        </Pill>
        <Link href={href} className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
          {c.openGuide}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
      <RecallList recalls={recalls} lang={lang} dict={dict} />
      {recalls.length > 0 && <p className="mt-3 text-xs text-muted">{c.vinNote}</p>}
    </section>
  );
}
