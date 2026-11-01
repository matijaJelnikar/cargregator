"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowDown, Check, ChevronDown, ChevronUp, Minus, Search } from "lucide-react";
import { CarPhoto } from "@/components/CarPhoto";
import { NcapBadge, ReportBadge, hasReport } from "@/components/CarReport";
import { useGeneration } from "@/components/GenerationSwitch";
import { years } from "@/components/RecallList";
import { button, Chip } from "@/components/ui";
import { allShort, pick, type CarGeneration } from "@/lib/carinfoDb";
import { DEFAULT_FILTERS, toQuery } from "@/lib/filters";
import { tn, type Dict, type Locale } from "@/lib/i18n";

/** Plain lists shared by the concise and expanded views. */
function ProsConsCards({ gen, lang, dict, concise = false }: { gen: CarGeneration; lang: Locale; dict: Dict; concise?: boolean }) {
  const c = dict.carInfo;
  const groups = [
    { title: c.prosTitle, items: gen.pros, icon: Check, tone: "text-success" },
    { title: c.consTitle, items: gen.cons, icon: Minus, tone: "text-danger" },
  ];
  return (
    <div className="grid gap-6 border-y border-border py-5 sm:grid-cols-2 sm:gap-8">
      {groups.filter(({ items }) => items.length > 0).map(({ title, items, icon: Icon, tone }) => (
        <section key={title} className="min-w-0">
          <h2 className="mb-3 text-sm font-semibold">{title}</h2>
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.en} className="flex items-start gap-2.5 text-sm leading-relaxed">
                <Icon className={`mt-1 size-4 shrink-0 ${tone}`} aria-hidden />
                <span>{concise && item.short ? pick(lang, item.short.sl, item.short.en) : pick(lang, item.sl, item.en)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Short lists by default; the toggle reveals full descriptions in the same layout. */
function ProsConsBlock({ gen, lang, dict }: { gen: CarGeneration; lang: Locale; dict: Dict }) {
  const c = dict.carInfo;
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="space-y-3">
      <ProsConsCards gen={gen} lang={lang} dict={dict} concise={!expanded} />
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
      >
        {expanded ? c.showLess : c.showMore}
        {expanded ? <ChevronUp className="size-3.5" aria-hidden /> : <ChevronDown className="size-3.5" aria-hidden />}
      </button>
    </div>
  );
}
/** The model page's photo, summary and pros/cons with a generation switcher shared with the cards below. */
export function ModelHero({ name, makeId, modelId, gens, lang, dict }: { name: string; makeId: string; modelId: string; gens: CarGeneration[]; lang: Locale; dict: Dict }) {
  const c = dict.carInfo;
  const { selected, select } = useGeneration();
  const gen = gens.find((g) => g.slug === selected) ?? gens[gens.length - 1];
  const search = toQuery({ ...DEFAULT_FILTERS, makeId, modelId, yearFrom: gen.year_from, ...(gen.year_to ? { yearTo: gen.year_to } : {}) });
  const report = hasReport(gen);
  const short = allShort(gen.pros) && allShort(gen.cons);
  return (
    <div className="space-y-4">
      <div className="grid gap-5 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:items-start">
        <CarPhoto gen={gen} alt={`${name} ${gen.name}`} dict={dict} priority />
        <div className="space-y-4">
          {gens.length > 1 && (
            <div>
              <p className="mb-2 font-mono text-[11px] font-medium uppercase tracking-wider text-subtle">{c.generationsTitle}</p>
              <div className="flex flex-wrap gap-2">
                {[...gens].reverse().map((g) => (
                  <Chip key={g.slug} pressed={g.slug === gen.slug} onClick={() => select(g.slug)}>
                    {g.name}
                  </Chip>
                ))}
              </div>
            </div>
          )}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-subtle">{c.yearsCol}</dt>
              <dd className="mt-0.5 font-medium">{years(gen.year_from, gen.year_to, dict)}</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-subtle">{c.engineCol}</dt>
              <dd className="mt-0.5 font-medium">{tn(c.engines, gen.engines.length, lang)}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap items-center gap-2">
            <NcapBadge gen={gen} dict={dict} />
            {report && <ReportBadge gen={gen} lang={lang} dict={dict} />}
          </div>
          {report && <p className="text-sm leading-relaxed">{pick(lang, gen.summary_sl, gen.summary_en)}</p>}
          <div className="flex flex-wrap items-center gap-4">
            <Link href={`/${lang}/results/?${search}`} className={button("primary", { className: "w-full sm:w-auto" })}>
              <Search className="size-4" aria-hidden />
              {c.searchCar}
            </Link>
          <a href={`#${gen.slug}`} className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
            {gen.name}
            <ArrowDown className="size-3.5" aria-hidden />
          </a>
          </div>
        </div>
      </div>
      {/* Without a report, one note instead of two empty boxes saying the same thing. */}
      {report && (gen.pros.length > 0 || gen.cons.length > 0) ? (
        short ? (
          <ProsConsBlock key={gen.slug} gen={gen} lang={lang} dict={dict} />
        ) : (
          <ProsConsCards gen={gen} lang={lang} dict={dict} />
        )
      ) : (
        <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted">{c.summarySoon}</p>
      )}
    </div>
  );
}
