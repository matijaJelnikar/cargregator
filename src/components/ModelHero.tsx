"use client";

import { useState } from "react";
import { ArrowDown, ChevronDown, ChevronUp, ThumbsDown, ThumbsUp } from "lucide-react";
import { CarPhoto } from "@/components/CarPhoto";
import { NcapBadge, ReportBadge, hasReport } from "@/components/CarReport";
import { useGeneration } from "@/components/GenerationSwitch";
import { years } from "@/components/RecallList";
import { Chip } from "@/components/ui";
import { allShort, pick, type CarGeneration, type ProCon } from "@/lib/carinfoDb";
import { tn, type Dict, type Locale } from "@/lib/i18n";

function ProsCons({
  title,
  items,
  icon: Icon,
  tone,
  lang,
}: {
  title: string;
  items: ProCon[];
  icon: typeof ThumbsUp;
  tone: string;
  lang: Locale;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="flex items-center gap-2 font-semibold">
        <Icon className={`size-4 ${tone}`} aria-hidden />
        {title}
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {items.map((x) => (
          <li key={x.en}>{pick(lang, x.sl, x.en)}</li>
        ))}
      </ul>
    </div>
  );
}

/** Both full-sentence cards: the expanded view, and the only view while a generation has no short labels. */
function ProsConsCards({ gen, lang, dict }: { gen: CarGeneration; lang: Locale; dict: Dict }) {
  const c = dict.carInfo;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {gen.pros.length > 0 && <ProsCons title={c.prosTitle} items={gen.pros} icon={ThumbsUp} tone="text-success" lang={lang} />}
      {gen.cons.length > 0 && <ProsCons title={c.consTitle} items={gen.cons} icon={ThumbsDown} tone="text-warning" lang={lang} />}
    </div>
  );
}

/** One row of short-label chips (pros or cons). */
function ChipRow({ title, items, icon: Icon, tone, chip, lang }: { title: string; items: ProCon[]; icon: typeof ThumbsUp; tone: string; chip: string; lang: Locale }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className={`mt-2 size-4 shrink-0 ${tone}`} aria-hidden />
      <h2 className="sr-only">{title}</h2>
      <ul className="flex flex-wrap gap-2">
        {items.map((x) => (
          <li key={x.en} className={`inline-flex min-h-8 items-center rounded-lg px-2.5 text-[13px] font-medium ${chip}`}>
            {pick(lang, x.short!.sl, x.short!.en)}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Short chips by default, with a toggle to the full pros and cons cards. Mounted with key={gen.slug} so the toggle resets per generation. */
function ProsConsBlock({ gen, lang, dict }: { gen: CarGeneration; lang: Locale; dict: Dict }) {
  const c = dict.carInfo;
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="space-y-2">
      {expanded ? (
        <ProsConsCards gen={gen} lang={lang} dict={dict} />
      ) : (
        <div className="space-y-2 rounded-xl border border-border bg-card p-4">
          {gen.pros.length > 0 && <ChipRow title={c.prosTitle} items={gen.pros} icon={ThumbsUp} tone="text-success" chip="bg-success-soft text-success" lang={lang} />}
          {gen.cons.length > 0 && <ChipRow title={c.consTitle} items={gen.cons} icon={ThumbsDown} tone="text-warning" chip="bg-warning-soft text-warning" lang={lang} />}
        </div>
      )}
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
export function ModelHero({ name, gens, lang, dict }: { name: string; gens: CarGeneration[]; lang: Locale; dict: Dict }) {
  const c = dict.carInfo;
  const { selected, select } = useGeneration();
  const gen = gens.find((g) => g.slug === selected) ?? gens[gens.length - 1];
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
          <a href={`#${gen.slug}`} className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
            {gen.name}
            <ArrowDown className="size-3.5" aria-hidden />
          </a>
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
