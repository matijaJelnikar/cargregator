"use client";

import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { CarLinks } from "@/components/CarLinks";
import { FailureList, VerdictPill, hasReport } from "@/components/CarReport";
import { RecallList, years } from "@/components/RecallList";
import { Eyebrow, Pill } from "@/components/ui";
import { findMake, findModel } from "@/data/makes";
import { modelSlug, pick, type CarGeneration } from "@/lib/carinfoDb";
import { engineFor, generationFor, generationsInRange, recallsFor, risksFor } from "@/lib/carinfoMatch";
import type { Fuel } from "@/lib/filters";
import { t, type Dict, type Locale } from "@/lib/i18n";
import { useCarInfo } from "@/lib/useCarInfo";

/** Engine names a report says to avoid. */
const avoid = (g: CarGeneration) => [...new Set(g.engines.filter((e) => e.verdict === "avoid").map((e) => e.name))];

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
              {hasReport(g) && avoid(g).length > 0 && (
                <span className="mt-0.5 block text-xs text-danger">
                  {c.verdict.avoid}: {avoid(g).join(", ")}
                </span>
              )}
            </span>
            <Pill tone={g.recalls.length ? "warning" : "neutral"} dot>
              {g.recalls.length ? t(c.recallCount, { n: g.recalls.length }) : c.noRecalls}
            </Pill>
          </li>
        ))}
      </ul>
      <div className="mt-3 border-t border-border pt-3">
        <CarLinks car={{ makeId, modelId, makeName: findMake(makeId)?.name ?? "", modelName: findModel(makeId, modelId)?.name ?? "" }} dict={dict} compact />
      </div>
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
  const report = hasReport(gen);
  const risks = report ? risksFor(gen, { engine, year }).slice(0, 3) : [];
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
        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted">
          {engine.name}, {engine.kw} kW
          {report && engine.verdict && <VerdictPill verdict={engine.verdict} dict={dict} />}
        </p>
      )}
      {report && engine?.verdict && <p className="mt-2 text-sm">{pick(lang, engine.summary_sl, engine.summary_en)}</p>}
      {risks.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="mb-2 font-mono text-[11px] font-medium uppercase tracking-wider text-subtle">{c.failuresTitle}</p>
          <FailureList failures={risks} gen={gen} lang={lang} dict={dict} />
        </div>
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
      <div className="mt-3 border-t border-border pt-3">
        <p className="mb-1.5 font-mono text-[11px] font-medium uppercase tracking-wider text-subtle">{c.linksGen}</p>
        <CarLinks car={{ makeId, modelId, makeName: findMake(makeId)?.name ?? "", modelName: findModel(makeId, modelId)?.name ?? "", gen }} dict={dict} compact />
      </div>
      <RecallList recalls={recalls} lang={lang} dict={dict} />
      {recalls.length > 0 && <p className="mt-3 text-xs text-muted">{c.vinNote}</p>}
    </section>
  );
}

/** Saved cars: a small warning when the report says to avoid this car's engine or lists likely problems for it. */
export function CarRiskPill({ dict, modelId, year, fuel, kw }: { dict: Dict; modelId?: string; year?: number; fuel?: Fuel; kw?: number }) {
  const gens = useCarInfo(modelId);
  const gen = gens && year !== undefined ? generationFor(gens, year) : undefined;
  if (!gen || !hasReport(gen)) return null;
  const engine = fuel && kw ? engineFor(gen, { fuel, kw, year }) : undefined;
  if (engine?.verdict === "avoid") {
    return (
      <Pill tone="danger" dot>
        {dict.carInfo.verdict.avoid}: {engine.name}
      </Pill>
    );
  }
  const likely = risksFor(gen, { engine, year }).filter((f) => f.likelihood === "high").length;
  return likely > 0 ? (
    <Pill tone="warning" dot>
      {t(dict.carInfo.likelyProblems, { n: likely })}
    </Pill>
  ) : null;
}
