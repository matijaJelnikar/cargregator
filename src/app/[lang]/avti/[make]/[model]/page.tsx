import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CarLinks } from "@/components/CarLinks";
import { CheckList, EngineVerdicts, FailureList, FoundLinks, VerdictPill, bestEngine, hasReport } from "@/components/CarReport";
import { GenerationDetails, GenerationProvider } from "@/components/GenerationSwitch";
import { ModelHero } from "@/components/ModelHero";
import { RecallList, years } from "@/components/RecallList";
import { ReportError } from "@/components/ReportError";
import { Eyebrow, button } from "@/components/ui";
import { MAKES, type Make, type Model } from "@/data/makes";
import { getGenerations, modelSlug, pick, type CarEngine, type CarGeneration } from "@/lib/carinfoDb";
import { DEFAULT_FILTERS, toQuery } from "@/lib/filters";
import { alternates, tn, type Dict, type Locale } from "@/lib/i18n";
import { getDictionary } from "../../../dictionaries";

// New or reviewed content shows up without a redeploy: pages are rendered on demand and cached.
export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

function find(makeParam: string, modelParam: string) {
  const make = MAKES.find((m) => m.id === makeParam);
  const model = make?.models.find((m) => modelSlug(make.id, m.id) === modelParam);
  return make && model ? { make, model } : undefined;
}

export async function generateMetadata({ params }: PageProps<"/[lang]/avti/[make]/[model]">): Promise<Metadata> {
  const p = await params;
  const found = find(p.make, p.model);
  if (!found) return {};
  const { lang, dict } = await getDictionary(p.lang);
  const name = `${found.make.name} ${found.model.name}`;
  // Same cached request as the page. The newest generation with a report describes the model best.
  const gens = await getGenerations(found.model.id).catch(() => []);
  const reported = [...gens].reverse().find(hasReport);
  const photo = [...gens].reverse().find((g) => g.image_url);
  const description = reported ? pick(lang, reported.summary_sl, reported.summary_en) : `${name}. ${dict.carInfo.intro}`;
  return {
    title: `${name}: ${dict.carInfo.title}`,
    description,
    alternates: alternates(lang, `/avti/${p.make}/${p.model}/`),
    ...(photo?.image_url ? { openGraph: { images: [{ url: photo.image_url, alt: `${name} ${photo.name}` }] } } : {}),
  };
}

function Generation({ gen, make, model, lang, dict }: { gen: CarGeneration; make: Make; model: Model; lang: Locale; dict: Dict }) {
  const c = dict.carInfo;
  const search = toQuery({ ...DEFAULT_FILTERS, makeId: make.id, modelId: model.id, yearFrom: gen.year_from, ...(gen.year_to ? { yearTo: gen.year_to } : {}) });
  const car = { makeId: make.id, modelId: model.id, makeName: make.name, modelName: model.name, gen };
  const report = hasReport(gen);
  const best = report ? bestEngine(gen.engines) : undefined;
  const engineHref = (e: CarEngine) => `/${lang}/avti/${make.id}/${modelSlug(make.id, model.id)}/${gen.slug}/${e.slug}/`;
  return (
    <GenerationDetails slug={gen.slug} className="group/gen scroll-mt-20 rounded-xl border border-border bg-card">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 p-4 [&::-webkit-details-marker]:hidden sm:px-5">
        <h3 className="text-lg font-semibold">{gen.name}</h3>
        <span className="font-mono text-sm text-muted">{years(gen.year_from, gen.year_to, dict)}</span>
        {best?.verdict && <VerdictPill verdict={best.verdict} dict={dict} />}
        {report && gen.failures.length > 0 && <span className="text-sm text-muted">{tn(c.problemCount, gen.failures.length, lang)}</span>}
        <ChevronDown className="ml-auto size-4 shrink-0 text-subtle transition-transform group-open/gen:rotate-180" aria-hidden />
      </summary>

      <div className="space-y-4 border-t border-border p-4 sm:p-5">
        {report && gen.engines.some((e) => e.verdict) && (
          <div>
            <h4 className="font-semibold">{c.enginesTitle}</h4>
            <EngineVerdicts engines={gen.engines} lang={lang} dict={dict} hrefFor={engineHref} />
          </div>
        )}
        {gen.failures.length > 0 && (
          <div>
            <h4 className="mb-2 font-semibold">{c.failuresTitle}</h4>
            <FailureList failures={gen.failures} gen={gen} lang={lang} dict={dict} />
          </div>
        )}
        {gen.checks.length > 0 && (
          <div>
            <h4 className="mb-2 font-semibold">{c.checksTitle}</h4>
            <CheckList gen={gen} lang={lang} />
          </div>
        )}

        <details>
          <summary className="cursor-pointer text-sm font-medium">{tn(c.engines, gen.engines.length, lang)}</summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border font-mono text-[11px] uppercase tracking-wider text-subtle">
                  <th className="py-2 pr-4 font-medium">{c.engineCol}</th>
                  <th className="py-2 pr-4 font-medium">{c.fuelCol}</th>
                  <th className="py-2 pr-4 font-medium">{c.powerCol}</th>
                  <th className="py-2 font-medium">{c.yearsCol}</th>
                </tr>
              </thead>
              <tbody>
                {gen.engines.map((e) => (
                  <tr key={e.id} className="border-b border-border last:border-0">
                    <td className="py-2 pr-4 font-medium">
                      <Link href={engineHref(e)} className="hover:text-accent">
                        {e.name}
                      </Link>
                      {e.engine_code && <span className="ml-2 font-mono text-xs font-normal text-subtle">{e.engine_code}</span>}
                    </td>
                    <td className="py-2 pr-4 text-muted">{dict.fuel[e.fuel]}</td>
                    <td className="whitespace-nowrap py-2 pr-4 font-mono text-muted">{e.kw ? `${e.kw} kW` : "–"}</td>
                    <td className="whitespace-nowrap py-2 font-mono text-muted">{years(e.year_from, e.year_to, dict)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <details>
            <summary className="cursor-pointer text-sm font-medium">{c.linksGen}</summary>
            <div className="mt-2 space-y-2">
              <CarLinks car={car} dict={dict} compact />
              {gen.links.length > 0 && (
                <div>
                  <p className="mb-1.5 font-mono text-[11px] font-medium uppercase tracking-wider text-subtle">{c.foundLinks}</p>
                  <FoundLinks gen={gen} dict={dict} />
                </div>
              )}
            </div>
          </details>
          <Link href={`/${lang}/results/?${search}`} className={button("secondary", { small: true })}>
            <Search className="size-4" aria-hidden />
            {c.searchGen}
          </Link>
        </div>
      </div>
    </GenerationDetails>
  );
}

export default async function ModelPage({ params }: PageProps<"/[lang]/avti/[make]/[model]">) {
  const p = await params;
  const { lang, dict } = await getDictionary(p.lang);
  const found = find(p.make, p.model);
  if (!found) notFound();
  const generations = await getGenerations(found.model.id);
  if (!generations.length) notFound();
  const { make, model } = found;
  const c = dict.carInfo;
  const name = `${make.name} ${model.name}`;
  const first = generations[0];
  const last = generations[generations.length - 1];
  const onSale = years(first.year_from, generations.some((g) => g.year_to === null) ? null : Math.max(...generations.map((g) => g.year_to ?? 0)), dict);
  const withRecalls = [...generations].reverse().filter((g) => g.recalls.length);
  const recallCount = withRecalls.reduce((n, g) => n + g.recalls.length, 0);
  const expanded = [...generations].reverse().find(hasReport) ?? last;
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Breadcrumbs lang={lang} dict={dict} make={make} model={model} />
      <div>
        <Eyebrow>{c.eyebrow}</Eyebrow>
        <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight sm:text-4xl">{name}</h1>
        <p className="mt-2 font-mono text-sm text-muted">
          {onSale} · {tn(c.generations, generations.length, lang)}
        </p>
      </div>

      <GenerationProvider initial={expanded.slug}>
        <ModelHero key={last.id} name={name} gens={generations} lang={lang} dict={dict} />

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{c.generationsTitle}</h2>
          {[...generations].reverse().map((g) => (
            <Generation key={g.id} gen={g} make={make} model={model} lang={lang} dict={dict} />
          ))}
        </section>
      </GenerationProvider>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{c.linksTitle}</h2>
        <CarLinks car={{ makeId: make.id, modelId: model.id, makeName: make.name, modelName: model.name }} dict={dict} compact />
      </section>

      {recallCount > 0 && (
        <details className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <summary className="cursor-pointer font-semibold">
            {c.recallsSection} ({recallCount})
          </summary>
          <p className="mt-2 text-sm text-muted">{c.recallVin}</p>
          {withRecalls.map((g) => (
            <div key={g.id} className="mt-4">
              <h3 className="text-sm font-semibold">
                {g.name} <span className="font-mono font-normal text-muted">{years(g.year_from, g.year_to, dict)}</span>
              </h3>
              <RecallList recalls={g.recalls} lang={lang} dict={dict} open />
            </div>
          ))}
        </details>
      )}

      <ReportError dict={dict} />
    </div>
  );
}
