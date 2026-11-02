"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, Minus, Search } from "lucide-react";
import { ModelBuyingGuide } from "@/components/ModelBuyingGuide";
import { summaryPreview } from "@/lib/buyingGuide";
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
/** Opening excerpt uses the report verbatim; the remaining context stays one click away. */
function Overview({ text, lang, dict }: { text: string; lang: Locale; dict: Dict }) {
  const { lead, rest } = summaryPreview(text, lang);
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold">{dict.carInfo.atGlance}</h2>
      <p className="text-sm leading-relaxed">{lead}</p>
      {rest && (
        <details>
          <summary className="cursor-pointer text-sm text-accent hover:underline">{dict.carInfo.fullOverview}</summary>
          <p className="mt-2 text-sm leading-relaxed text-muted">{rest}</p>
        </details>
      )}
    </div>
  );
}

/** One generation at a time: overview, buying advice, inspection, then reference material. */
export function ModelHero({ name, makeId, modelId, makeName, modelName, gens, lang, dict }: {
  name: string; makeId: string; modelId: string; makeName: string; modelName: string; gens: CarGeneration[]; lang: Locale; dict: Dict;
}) {
  const c = dict.carInfo;
  const { selected, select } = useGeneration();
  const gen = gens.find((g) => g.slug === selected) ?? gens[gens.length - 1];
  useEffect(() => {
    const followHash = () => {
      const slug = window.location.hash.slice(1);
      if (gens.some((g) => g.slug === slug)) select(slug);
    };
    followHash();
    window.addEventListener("hashchange", followHash);
    return () => window.removeEventListener("hashchange", followHash);
  }, [gens, select]);
  const search = toQuery({ ...DEFAULT_FILTERS, makeId, modelId, yearFrom: gen.year_from, ...(gen.year_to ? { yearTo: gen.year_to } : {}) });
  const report = hasReport(gen);
  const short = allShort(gen.pros) && allShort(gen.cons);
  const assessed = report && gen.engines.some((e) => e.verdict);
  return (
    <div className="space-y-8">
      {gens.length > 1 && (
        <div>
          <p className="mb-2 text-sm font-medium text-muted">{c.chooseGeneration}</p>
          <div className="flex flex-wrap gap-2">
            {[...gens].reverse().map((g) => (
              <Chip key={g.slug} pressed={g.slug === gen.slug} onClick={() => select(g.slug)}>
                {g.name}<span className="ml-2 text-xs opacity-75">{years(g.year_from, g.year_to, dict)}</span>
              </Chip>
            ))}
          </div>
        </div>
      )}
      <div id={gen.slug} className="scroll-mt-24 space-y-5">
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start">
          <CarPhoto gen={gen} alt={`${name} ${gen.name}`} dict={dict} priority />
          <div className="space-y-4">
            <div>
              <p className="font-semibold">{gen.name}</p>
              <p className="mt-1 font-mono text-xs text-muted">
                {years(gen.year_from, gen.year_to, dict)} · {tn(c.engines, gen.engines.length, lang)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <NcapBadge gen={gen} dict={dict} />
              {report && <ReportBadge gen={gen} lang={lang} dict={dict} />}
            </div>
            {report && <Overview key={gen.slug} text={pick(lang, gen.summary_sl, gen.summary_en)} lang={lang} dict={dict} />}
            <Link href={`/${lang}/results/?${search}`} className={button("primary", { className: "w-full sm:w-auto" })}>
              <Search className="size-4" aria-hidden />{c.searchCar}
            </Link>
            {report && (
              <a href="#guide-sources" onClick={() => {
                const sources = document.getElementById("guide-sources");
                if (sources instanceof HTMLDetailsElement) sources.open = true;
              }} className="block text-xs text-muted hover:text-accent hover:underline">{c.sourcesAndReview}</a>
            )}
          </div>
        </div>
        {report && (
          <nav aria-label={c.guideNavigation} className="flex flex-wrap gap-x-5 gap-y-2 border-b border-border pb-3 text-sm text-accent">
            {assessed && <a href="#engine-choices" className="hover:underline">{c.engineChoicesTitle}</a>}
            {gen.failures.length > 0 && <a href="#ownership-risks" className="hover:underline">{c.priorityRisksTitle}</a>}
            {gen.checks.length > 0 && <a href="#inspection-checklist" className="hover:underline">{c.checksTitle}</a>}
            <a href="#specifications" className="hover:underline">{c.specificationsTitle}</a>
          </nav>
        )}
        {report && (gen.pros.length > 0 || gen.cons.length > 0) ? (
          short ? <ProsConsBlock key={gen.slug} gen={gen} lang={lang} dict={dict} /> : <ProsConsCards gen={gen} lang={lang} dict={dict} />
        ) : (
          <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted">{c.summarySoon}</p>
        )}
      </div>
      <ModelBuyingGuide key={gen.slug} gen={gen} makeId={makeId} modelId={modelId} makeName={makeName} modelName={modelName} lang={lang} dict={dict} />
    </div>
  );
}