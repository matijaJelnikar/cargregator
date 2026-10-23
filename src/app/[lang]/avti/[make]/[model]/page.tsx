import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Search } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CarLinks } from "@/components/CarLinks";
import { CarPhoto } from "@/components/CarPhoto";
import { CheckList, EngineVerdicts, FailureList, FoundLinks, NcapBadge, hasReport } from "@/components/CarReport";
import { ModelHero } from "@/components/ModelHero";
import { RecallList, years } from "@/components/RecallList";
import { ReportError } from "@/components/ReportError";
import { Card, Eyebrow, button } from "@/components/ui";
import { MAKES, type Make, type Model } from "@/data/makes";
import { getGenerations, modelSlug, pick, type CarEngine, type CarGeneration } from "@/lib/carinfoDb";
import { DEFAULT_FILTERS, toQuery } from "@/lib/filters";
import { alternates, t, type Dict, type Locale } from "@/lib/i18n";
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
  const engineHref = (e: CarEngine) => `/${lang}/avti/${make.id}/${modelSlug(make.id, model.id)}/${gen.slug}/${e.slug}/`;
  return (
    <Card className="scroll-mt-20">
      <div id={gen.slug} className="grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
        <CarPhoto gen={gen} alt={`${make.name} ${gen.name}`} dict={dict} />
        <div className="min-w-0 space-y-3">
          <h3 className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-lg font-semibold">
            {gen.name}
            <span className="font-mono text-sm font-normal text-muted">{years(gen.year_from, gen.year_to, dict)}</span>
          </h3>
          <NcapBadge gen={gen} dict={dict} />
          {report && <p className="text-sm leading-relaxed text-muted">{pick(lang, gen.summary_sl, gen.summary_en)}</p>}
          <div>
            <p className="mb-1.5 font-mono text-[11px] font-medium uppercase tracking-wider text-subtle">{c.linksGen}</p>
            <CarLinks car={car} dict={dict} compact />
          </div>
          {gen.links.length > 0 && (
            <div>
              <p className="mb-1.5 font-mono text-[11px] font-medium uppercase tracking-wider text-subtle">{c.foundLinks}</p>
              <FoundLinks gen={gen} dict={dict} />
            </div>
          )}
          <Link href={`/${lang}/results/?${search}`} className={button("secondary", { small: true })}>
            <Search className="size-4" aria-hidden />
            {c.searchGen}
          </Link>
        </div>
      </div>

      {report && gen.engines.some((e) => e.verdict) && (
        <div className="mt-4 border-t border-border pt-4">
          <h4 className="font-semibold">{c.enginesTitle}</h4>
          <EngineVerdicts engines={gen.engines} lang={lang} dict={dict} hrefFor={engineHref} />
        </div>
      )}
      {gen.failures.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <h4 className="font-semibold">{c.failuresTitle}</h4>
          <p className="mb-3 mt-1 text-sm text-muted">{c.failuresIntro}</p>
          <FailureList failures={gen.failures} engines={gen.engines} lang={lang} dict={dict} />
        </div>
      )}
      {gen.checks.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <h4 className="mb-2 font-semibold">{c.checksTitle}</h4>
          <CheckList gen={gen} lang={lang} />
        </div>
      )}

      <details className="mt-4 border-t border-border pt-4">
        <summary className="cursor-pointer text-sm font-medium">{t(c.engines, { n: gen.engines.length })}</summary>
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
    </Card>
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
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Breadcrumbs lang={lang} dict={dict} make={make} model={model} />
      <div>
        <Eyebrow>{c.eyebrow}</Eyebrow>
        <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight sm:text-4xl">{name}</h1>
        <p className="mt-2 font-mono text-sm text-muted">
          {onSale} · {t(c.generations, { n: generations.length })}
        </p>
      </div>

      <ModelHero key={last.id} name={name} gens={generations} lang={lang} dict={dict} />

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">{c.linksTitle}</h2>
          <p className="mt-1 text-sm text-muted">{c.linksIntro}</p>
        </div>
        <CarLinks car={{ makeId: make.id, modelId: model.id, makeName: make.name, modelName: model.name }} dict={dict} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{c.generationsTitle}</h2>
        {[...generations].reverse().map((g) => (
          <Generation key={g.id} gen={g} make={make} model={model} lang={lang} dict={dict} />
        ))}
      </section>

      {recallCount > 0 && (
        <details className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <summary className="cursor-pointer font-semibold">
            {c.recallsSection} ({recallCount})
          </summary>
          <p className="mt-2 text-sm text-muted">{c.recallsIntro}</p>
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

      <p className="rounded-lg border border-border bg-surface-low p-3 text-sm leading-relaxed text-muted">{c.unreviewed}</p>
      <ReportError dict={dict} />
    </div>
  );
}
