import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { RecallList, years } from "@/components/RecallList";
import { ReportError } from "@/components/ReportError";
import { Card, Eyebrow, Pill, button } from "@/components/ui";
import { MAKES } from "@/data/makes";
import { getGenerations, modelSlug, type CarGeneration } from "@/lib/carinfoDb";
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
  return {
    title: `${name}: ${dict.carInfo.title}`,
    description: `${name}. ${dict.carInfo.intro}`,
    alternates: alternates(lang, `/avti/${p.make}/${p.model}/`),
  };
}

function Generation({ gen, makeId, modelId, lang, dict }: { gen: CarGeneration; makeId: string; modelId: string; lang: Locale; dict: Dict }) {
  const c = dict.carInfo;
  const search = toQuery({ ...DEFAULT_FILTERS, makeId, modelId, yearFrom: gen.year_from, ...(gen.year_to ? { yearTo: gen.year_to } : {}) });
  return (
    <Card
      title={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {gen.name}
          <span className="font-mono text-sm font-normal text-muted">{years(gen.year_from, gen.year_to, dict)}</span>
        </span>
      }
      aside={
        <Pill tone={gen.recalls.length ? "warning" : "neutral"} dot>
          {gen.recalls.length ? t(c.recallCount, { n: gen.recalls.length }) : c.noRecalls}
        </Pill>
      }
    >
      <div className="overflow-x-auto">
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
                  <Link href={`/${lang}/avti/${makeId}/${modelSlug(makeId, modelId)}/${gen.slug}/${e.slug}/`} className="hover:text-accent">
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

      <RecallList recalls={gen.recalls} lang={lang} dict={dict} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm text-muted">{c.soon}</p>
        <Link href={`/${lang}/results/?${search}`} className={button("secondary", { small: true })}>
          <Search className="size-4" aria-hidden />
          {c.searchGen}
        </Link>
      </div>
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
  const c = dict.carInfo;
  const engineCount = generations.reduce((n, g) => n + g.engines.length, 0);
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href={`/${lang}/avti/`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        {c.allModels}
      </Link>
      <div>
        <Eyebrow>{c.eyebrow}</Eyebrow>
        <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight sm:text-4xl">
          {found.make.name} {found.model.name}
        </h1>
        <p className="mt-2 font-mono text-sm text-muted">
          {t(c.generations, { n: generations.length })} · {t(c.engines, { n: engineCount })}
        </p>
      </div>
      <p className="rounded-lg border border-border bg-surface-low p-3 text-sm leading-relaxed text-muted">{c.unreviewed}</p>
      {generations.map((g) => (
        <Generation key={g.id} gen={g} makeId={found.make.id} modelId={found.model.id} lang={lang} dict={dict} />
      ))}
      <ReportError dict={dict} />
    </div>
  );
}
