import { BadgeCheck, Check, ChevronDown, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";
import { years } from "@/components/RecallList";
import { Pill, type Tone } from "@/components/ui";
import { pick, type CarEngine, type CarFailure, type CarGeneration } from "@/lib/carinfoDb";
import { formatDate, formatEur, t, type Dict, type Locale } from "@/lib/i18n";
import { costBand, showExactCost } from "@/lib/reportPolicy";

const VERDICT_TONE: Record<NonNullable<CarEngine["verdict"]>, Tone> = { recommended: "success", ok: "neutral", avoid: "danger", issues: "warning" };
const VERDICT_RANK: Record<NonNullable<CarEngine["verdict"]>, number> = { recommended: 3, ok: 2, issues: 1, avoid: 0 };
const LIKELIHOOD_TONE: Record<CarFailure["likelihood"], Tone> = { low: "neutral", med: "warning", high: "danger" };
export const LIKELIHOOD_ORDER: Record<CarFailure["likelihood"], number> = { high: 0, med: 1, low: 2 };

export const hasReport = (gen: Pick<CarGeneration, "status">) => gen.status === "ai_checked" || gen.status === "reviewed";

/** High → med → low, keeping the incoming order within one likelihood. */
export const byLikelihood = (failures: CarFailure[]) =>
  [...failures].sort((a, b) => LIKELIHOOD_ORDER[a.likelihood] - LIKELIHOOD_ORDER[b.likelihood]);

/** Engines with a verdict, grouped by name in their incoming order. */
export function enginesByName(engines: CarEngine[]) {
  const byName = new Map<string, CarEngine[]>();
  for (const e of engines) if (e.verdict) byName.set(e.name, [...(byName.get(e.name) ?? []), e]);
  return byName;
}

const byScore = (a: CarEngine, b: CarEngine) =>
  (b.score ?? -1) - (a.score ?? -1) || VERDICT_RANK[b.verdict ?? "avoid"] - VERDICT_RANK[a.verdict ?? "avoid"];

/** The engine we would recommend first: highest score, ties by verdict (recommended > ok > issues > avoid). */
export const bestEngine = (engines: CarEngine[]) => [...enginesByName(engines)].map(([, list]) => list[0]).sort(byScore)[0];

const range = (min: number | null, max: number | null, lang: Locale) =>
  min != null && max != null ? `${formatEur(min, lang)}–${formatEur(max, lang)}` : min != null ? formatEur(min, lang) : max != null ? formatEur(max, lang) : null;

export function VerdictPill({ verdict, dict }: { verdict: NonNullable<CarEngine["verdict"]>; dict: Dict }) {
  return (
    <Pill tone={VERDICT_TONE[verdict]} dot>
      {dict.carInfo.verdict[verdict]}
    </Pill>
  );
}

export function NcapBadge({ gen, dict }: { gen: Pick<CarGeneration, "ncap_stars" | "ncap_year" | "ncap_url">; dict: Dict }) {
  if (gen.ncap_stars == null || !gen.ncap_url) return null;
  return (
    <a href={gen.ncap_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium hover:border-accent">
      <ShieldCheck className="size-3.5 text-accent" aria-hidden />
      {t(dict.carInfo.ncap, { stars: gen.ncap_stars, year: gen.ncap_year ?? "" })}
    </a>
  );
}

/** "AI-assisted, checked" or "reviewed" as a pill: always shown next to report content. */
export function ReportBadge({ gen, lang, dict }: { gen: Pick<CarGeneration, "status" | "reviewed_at">; lang: Locale; dict: Dict }) {
  const c = dict.carInfo;
  if (gen.status !== "reviewed") {
    return (
      <span title={c.aiChecked}>
        <Pill tone="info">
          <Sparkles className="size-3" aria-hidden />
          {c.aiSummary}
        </Pill>
      </span>
    );
  }
  return (
    <span title={gen.reviewed_at ? t(c.reviewedOn, { date: formatDate(gen.reviewed_at, lang) }) : c.reviewed}>
      <Pill tone="success">
        <BadgeCheck className="size-3" aria-hidden />
        {c.reviewedPill}
      </Pill>
    </span>
  );
}

/** One line per engine name with its verdict, score and yearly running cost. */
export function EngineVerdicts({ engines, lang, dict, hrefFor }: { engines: CarEngine[]; lang: Locale; dict: Dict; hrefFor: (e: CarEngine) => string }) {
  const c = dict.carInfo;
  const byName = enginesByName(engines);
  if (!byName.size) return null;
  return (
    <ul className="divide-y divide-border">
      {[...byName].map(([name, list]) => {
        const e = list[0];
        const cost = range(e.annual_cost_min, e.annual_cost_max, lang);
        const kw = list.map((x) => x.kw).filter((x): x is number => x != null);
        return (
          <li key={name} className="py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <a href={hrefFor(e)} className="font-medium hover:text-accent">
                {name}
                {kw.length > 0 && <span className="ml-2 font-mono text-xs font-normal text-subtle">{Math.min(...kw) === Math.max(...kw) ? `${kw[0]} kW` : `${Math.min(...kw)}–${Math.max(...kw)} kW`}</span>}
              </a>
              <span className="flex items-center gap-2">
                {e.score != null && <span className="font-mono text-xs text-muted">{t(c.score, { n: e.score })}</span>}
                <VerdictPill verdict={e.verdict!} dict={dict} />
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">{pick(lang, e.summary_sl, e.summary_en)}</p>
            {cost && (
              <p className="mt-0.5 font-mono text-xs text-subtle" title={c.annualCostHint}>
                {t(c.annualCost, { min: formatEur(e.annual_cost_min ?? 0, lang), max: formatEur(e.annual_cost_max ?? e.annual_cost_min ?? 0, lang) })}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Repair costs: the exact range once the generation is reviewed, a low/medium/high band before (lib/reportPolicy.ts). */
export function FailureList({ failures, gen, lang, dict }: { failures: CarFailure[]; gen: Pick<CarGeneration, "engines" | "status">; lang: Locale; dict: Dict }) {
  const engines = gen.engines;
  const exact = showExactCost(gen);
  const c = dict.carInfo;
  if (!failures.length) return null;
  const engineName = new Map(engines.map((e) => [e.id, e.name]));
  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {byLikelihood(failures).map((f) => {
        const band = costBand(f);
        const cost = exact ? range(f.cost_min, f.cost_max, lang) : band && c.costBand[band];
        const engine = f.engine_id ? engineName.get(f.engine_id) : undefined;
        return (
          <li key={f.id} id={`problem-${f.id}`} className="scroll-mt-20">
            <details className="group/problem">
              <summary className="block cursor-pointer list-none p-3 [&::-webkit-details-marker]:hidden">
                <span className="flex items-start gap-2">
                  <span className="min-w-0 flex-1 font-medium">{pick(lang, f.title_sl, f.title_en)}</span>
                  <ChevronDown className="mt-1 size-4 shrink-0 text-subtle transition-transform group-open/problem:rotate-180" aria-hidden />
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Pill tone={LIKELIHOOD_TONE[f.likelihood]} dot>
                    {c.likelihood[f.likelihood]}
                  </Pill>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-subtle">
                    {c.area[f.area]}
                    {engine && <> · {engine}</>}
                    {(f.year_from || f.year_to) && <> · {years(f.year_from, f.year_to, dict)}</>}
                    {cost && (
                      <>
                        {" · "}
                        <span className={exact ? "normal-case tracking-normal" : "font-sans normal-case tracking-normal"} title={exact ? undefined : c.costBandHint}>
                          {cost}
                        </span>
                      </>
                    )}
                  </span>
                </span>
              </summary>
              <div className="px-3 pb-3">
                <p className="text-sm leading-relaxed text-muted">{pick(lang, f.body_sl, f.body_en)}</p>
                {(f.symptoms_sl || f.symptoms_en) && (
                  <p className="mt-1.5 text-sm">
                    <span className="font-medium">{c.symptoms}: </span>
                    <span className="text-muted">{pick(lang, f.symptoms_sl, f.symptoms_en)}</span>
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-subtle">{c.sources}:</span>
                    {f.sources.map((s) => (
                      <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-accent hover:underline">
                        {new URL(s.url).hostname.replace(/^www\./, "")}
                        <ExternalLink className="size-3" aria-hidden />
                      </a>
                    ))}
                  </span>
                </div>
                {f.ai_check === "weak" && <p className="mt-1.5 text-xs text-subtle">{c.weakSource}</p>}
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}

export function CheckList({ gen, lang }: { gen: Pick<CarGeneration, "checks">; lang: Locale }) {
  if (!gen.checks.length) return null;
  return (
    <ol className="space-y-1.5 text-sm">
      {gen.checks.map((ch) => (
        <li key={ch.id} className="flex gap-2">
          <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
          <span>{pick(lang, ch.text_sl, ch.text_en)}</span>
        </li>
      ))}
    </ol>
  );
}

/** Exact pages the report found for this generation (road tests, NCAP page, reviews). */
export function FoundLinks({ gen, dict }: { gen: Pick<CarGeneration, "links">; dict: Dict }) {
  if (!gen.links.length) return null;
  const c = dict.carInfo;
  return (
    <ul className="space-y-1.5 text-sm">
      {gen.links.map((l) => (
        <li key={l.id} className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-subtle">{c.linkKind[l.kind]}</span>
          <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">
            {l.label}
            <ExternalLink className="size-3" aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  );
}
