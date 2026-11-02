import Link from "next/link";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { CarLinks } from "@/components/CarLinks";
import { CheckList, FailureList, FoundLinks, hasReport, VerdictPill } from "@/components/CarReport";
import { RecallList, years } from "@/components/RecallList";
import { engineShortlist, powerLabel, priorityRisks } from "@/lib/buyingGuide";
import { modelSlug, pick, type CarEngine, type CarGeneration } from "@/lib/carinfoDb";
import { formatDate, t, tn, type Dict, type Locale } from "@/lib/i18n";

const disclosure = "group rounded-xl border border-border bg-card p-4 sm:p-5";
const disclosureTitle = "flex cursor-pointer list-none items-center justify-between gap-3 font-semibold [&::-webkit-details-marker]:hidden";
const chevron = "size-4 shrink-0 text-subtle transition-transform group-open:rotate-180";

/** Buying advice for the selected generation, followed by supporting reference material. */
export function ModelBuyingGuide({ gen, makeId, modelId, makeName, modelName, lang, dict }: {
  gen: CarGeneration; makeId: string; modelId: string; makeName: string; modelName: string; lang: Locale; dict: Dict;
}) {
  const c = dict.carInfo;
  const report = hasReport(gen);
  const { choices, caution } = report ? engineShortlist(gen.engines) : { choices: [], caution: [] };
  const risks = report ? priorityRisks(gen.failures) : [];
  const rest = gen.failures.filter((f) => !risks.some((r) => r.id === f.id));
  const hrefFor = (e: CarEngine) => `/${lang}/avti/${makeId}/${modelSlug(makeId, modelId)}/${gen.slug}/${e.slug}/`;
  const car = { makeId, modelId, makeName, modelName, gen };
  const engineChoice = (e: CarEngine) => (
    <li key={e.id} className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={hrefFor(e)} className="inline-flex items-center gap-1 font-semibold hover:text-accent">
          {e.name}<ArrowUpRight className="size-4" aria-hidden />
        </Link>
        <VerdictPill verdict={e.verdict!} dict={dict} />
      </div>
      <p className="mt-1 font-mono text-xs text-subtle">
        {dict.fuel[e.fuel]}{e.kw != null && <> · {powerLabel(e.kw, lang)}</>} · {years(e.year_from, e.year_to, dict)}
        {e.engine_code && <> · {e.engine_code}</>}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{pick(lang, e.summary_sl, e.summary_en)}</p>
    </li>
  );
  return (
    <div className="space-y-8">
      {report && (choices.length > 0 || caution.length > 0) && (
        <section id="engine-choices" className="scroll-mt-24 space-y-4" aria-labelledby="engine-choices-title">
          <h2 id="engine-choices-title" className="text-xl font-semibold">{c.engineChoicesTitle}</h2>
          <div className={caution.length ? "grid gap-6 sm:grid-cols-2 sm:gap-8" : "space-y-4"}>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-success">{c.goodChoices}</h3>
              {choices.length ? <ul className="divide-y divide-border">{choices.map(engineChoice)}</ul> : <p className="text-sm text-muted">{c.noEnginePick}</p>}
            </div>
            {caution.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-warning">{c.cautionChoices}</h3>
                <ul>{caution.map(engineChoice)}</ul>
              </div>
            )}
          </div>
          <a href="#engine-specifications" onClick={() => {
            const specs = document.getElementById("engine-specifications");
            if (specs instanceof HTMLDetailsElement) specs.open = true;
          }} className="inline-block text-sm text-accent hover:underline">{c.allEngines}</a>
        </section>
      )}

      {risks.length > 0 && (
        <section id="ownership-risks" className="scroll-mt-24 space-y-3" aria-labelledby="ownership-risks-title">
          <h2 id="ownership-risks-title" className="text-xl font-semibold">{c.priorityRisksTitle}</h2>
          <FailureList failures={risks} gen={gen} lang={lang} dict={dict} expanded />
          {rest.length > 0 && (
            <details>
              <summary className="cursor-pointer text-sm font-medium text-accent">{c.otherProblems} ({rest.length})</summary>
              <div className="mt-3"><FailureList failures={rest} gen={gen} lang={lang} dict={dict} /></div>
            </details>
          )}
        </section>
      )}

      {report && gen.checks.length > 0 && (
        <section id="inspection-checklist" className="scroll-mt-24 space-y-3" aria-labelledby="inspection-checklist-title">
          <h2 id="inspection-checklist-title" className="text-xl font-semibold">{c.checksTitle}</h2>
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5"><CheckList gen={gen} lang={lang} /></div>
        </section>
      )}

      <section id="specifications" className="scroll-mt-24 space-y-3" aria-labelledby="reference-title">
        <h2 id="reference-title" className="text-xl font-semibold">{c.referenceTitle}</h2>
        <details id="engine-specifications" className={disclosure}>
          <summary className={disclosureTitle}>{c.specificationsTitle} · {tn(c.engines, gen.engines.length, lang)}<ChevronDown className={chevron} aria-hidden /></summary>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-subtle">
                  <th className="py-2 pr-4 font-medium">{c.engineCol}</th>
                  <th className="py-2 pr-4 font-medium">{c.fuelCol}</th>
                  <th className="py-2 pr-4 font-medium">{c.powerCol}</th>
                  <th className="py-2 pr-4 font-medium">{c.yearsCol}</th>
                  {report && <th className="py-2 font-medium">{c.engineAssessment}</th>}
                </tr>
              </thead>
              <tbody>
                {gen.engines.map((e) => (
                  <tr key={e.id} className="border-b border-border align-top last:border-0">
                    <td className="py-3 pr-4">
                      <Link href={hrefFor(e)} className="font-medium hover:text-accent">{e.name}</Link>
                      {e.engine_code && <p className="font-mono text-xs text-subtle">{e.engine_code}</p>}
                    </td>
                    <td className="py-3 pr-4 text-muted">{dict.fuel[e.fuel]}</td>
                    <td className="whitespace-nowrap py-3 pr-4 font-mono text-muted">{e.kw != null ? powerLabel(e.kw, lang) : "–"}</td>
                    <td className="whitespace-nowrap py-3 pr-4 font-mono text-muted">{years(e.year_from, e.year_to, dict)}</td>
                    {report && (
                      <td className="min-w-56 py-3">
                        {e.verdict && <VerdictPill verdict={e.verdict} dict={dict} />}
                        <p className="mt-1 text-xs leading-relaxed text-muted">{pick(lang, e.summary_sl, e.summary_en)}</p>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        {gen.recalls.length > 0 && (
          <details className={disclosure}>
            <summary className={disclosureTitle}>{c.recallsSection} ({gen.recalls.length})<ChevronDown className={chevron} aria-hidden /></summary>
            <p className="mt-3 text-sm text-muted">{c.recallVin}</p>
            <div className="mt-3"><RecallList recalls={gen.recalls} lang={lang} dict={dict} open /></div>
          </details>
        )}

        <details id="guide-sources" className={`${disclosure} scroll-mt-24`}>
          <summary className={disclosureTitle}>{c.sourcesAndReview}<ChevronDown className={chevron} aria-hidden /></summary>
          <div className="mt-4 space-y-4">
            {report && (
              <p className="text-sm leading-relaxed text-muted">
                {gen.status === "reviewed" ? (gen.reviewed_at ? t(c.reviewedOn, { date: formatDate(gen.reviewed_at, lang) }) : c.reviewed) : c.aiChecked}
              </p>
            )}
            {gen.links.length > 0 && <FoundLinks gen={gen} dict={dict} />}
            <CarLinks car={car} dict={dict} compact />
          </div>
        </details>
      </section>
    </div>
  );
}
