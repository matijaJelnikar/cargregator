"use client";

import { useState } from "react";
import { ArrowDown, ThumbsDown, ThumbsUp } from "lucide-react";
import { CarPhoto } from "@/components/CarPhoto";
import { NcapBadge, ReportNote, hasReport } from "@/components/CarReport";
import { years } from "@/components/RecallList";
import { Chip } from "@/components/ui";
import { pick, type Bilingual, type CarGeneration } from "@/lib/carinfoDb";
import { tn, type Dict, type Locale } from "@/lib/i18n";

function ProsCons({
  title,
  items,
  icon: Icon,
  tone,
  lang,
}: {
  title: string;
  items: Bilingual[];
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

/** The model page's photo, summary and pros/cons with a generation switcher; starts on the newest one with a report. */
export function ModelHero({ name, gens, lang, dict }: { name: string; gens: CarGeneration[]; lang: Locale; dict: Dict }) {
  const c = dict.carInfo;
  // Open on the newest generation that has a report, so a model with any content doesn't start on "coming soon".
  const [slug, setSlug] = useState(([...gens].reverse().find(hasReport) ?? gens[gens.length - 1]).slug);
  const gen = gens.find((g) => g.slug === slug) ?? gens[gens.length - 1];
  const report = hasReport(gen);
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
                  <Chip key={g.slug} pressed={g.slug === gen.slug} onClick={() => setSlug(g.slug)}>
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
          <NcapBadge gen={gen} dict={dict} />
          {report && <p className="text-sm leading-relaxed">{pick(lang, gen.summary_sl, gen.summary_en)}</p>}
          <a href={`#${gen.slug}`} className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
            {gen.name}
            <ArrowDown className="size-3.5" aria-hidden />
          </a>
        </div>
      </div>
      {/* Without a report, one note instead of two empty boxes saying the same thing. */}
      {report && (gen.pros.length > 0 || gen.cons.length > 0) ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {gen.pros.length > 0 && <ProsCons title={c.prosTitle} items={gen.pros} icon={ThumbsUp} tone="text-success" lang={lang} />}
          {gen.cons.length > 0 && <ProsCons title={c.consTitle} items={gen.cons} icon={ThumbsDown} tone="text-warning" lang={lang} />}
        </div>
      ) : (
        <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted">{c.summarySoon}</p>
      )}
      {report && <ReportNote gen={gen} lang={lang} dict={dict} />}
    </div>
  );
}
