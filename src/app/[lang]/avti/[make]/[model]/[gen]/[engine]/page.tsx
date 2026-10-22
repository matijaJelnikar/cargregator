import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { RecallList, years } from "@/components/RecallList";
import { ReportError } from "@/components/ReportError";
import { Card, Eyebrow, Pill, button } from "@/components/ui";
import { MAKES } from "@/data/makes";
import { getGenerations, modelSlug } from "@/lib/carinfoDb";
import { recallsInYears } from "@/lib/carinfoMatch";
import { DEFAULT_FILTERS, toQuery } from "@/lib/filters";
import { alternates, t } from "@/lib/i18n";
import { getDictionary } from "../../../../../dictionaries";

// Rendered on demand and cached, like the model page.
export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

async function load(p: { make: string; model: string; gen: string; engine: string }) {
  const make = MAKES.find((m) => m.id === p.make);
  const model = make?.models.find((m) => modelSlug(make.id, m.id) === p.model);
  if (!make || !model) return undefined;
  const gen = (await getGenerations(model.id)).find((g) => g.slug === p.gen);
  const engine = gen?.engines.find((e) => e.slug === p.engine);
  return gen && engine ? { make, model, gen, engine } : undefined;
}

export async function generateMetadata({ params }: PageProps<"/[lang]/avti/[make]/[model]/[gen]/[engine]">): Promise<Metadata> {
  const p = await params;
  const found = await load(p);
  if (!found) return {};
  const { lang, dict } = await getDictionary(p.lang);
  const name = `${found.make.name} ${found.model.name} ${found.gen.name} ${found.engine.name}`;
  return {
    title: name,
    description: `${name}. ${dict.carInfo.intro}`,
    alternates: alternates(lang, `/avti/${p.make}/${p.model}/${p.gen}/${p.engine}/`),
  };
}

export default async function EnginePage({ params }: PageProps<"/[lang]/avti/[make]/[model]/[gen]/[engine]">) {
  const p = await params;
  const { lang, dict } = await getDictionary(p.lang);
  const found = await load(p);
  if (!found) notFound();
  const { make, model, gen, engine } = found;
  const c = dict.carInfo;

  // Notices that name only a few years apply to the engine only if those years overlap its own.
  const recalls = recallsInYears(gen.recalls, engine.year_from, engine.year_to);
  const search = toQuery({
    ...DEFAULT_FILTERS,
    makeId: make.id,
    modelId: model.id,
    yearFrom: engine.year_from ?? gen.year_from,
    ...((engine.year_to ?? gen.year_to) ? { yearTo: (engine.year_to ?? gen.year_to)! } : {}),
    fuel: [engine.fuel],
    ...(engine.kw ? { powerFromKw: engine.kw } : {}),
  });
  const specs: [string, string][] = [
    [c.fuelCol, dict.fuel[engine.fuel]],
    [c.powerCol, engine.kw ? `${engine.kw} kW` : "–"],
    [c.sizeCol, engine.ccm ? `${engine.ccm} cm³` : "–"],
    [c.yearsCol, years(engine.year_from, engine.year_to, dict)],
    ...(engine.engine_code ? ([[c.codeCol, engine.engine_code]] as [string, string][]) : []),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href={`/${lang}/avti/${make.id}/${p.model}/`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        {t(c.backTo, { model: `${make.name} ${model.name}` })}
      </Link>
      <div>
        <Eyebrow>
          {make.name} {model.name} · {gen.name}
        </Eyebrow>
        <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight sm:text-4xl">{engine.name}</h1>
      </div>
      <p className="rounded-lg border border-border bg-surface-low p-3 text-sm leading-relaxed text-muted">{c.unreviewed}</p>
      <Card>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          {specs.map(([label, value]) => (
            <div key={label}>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-subtle">{label}</dt>
              <dd className="mt-1 font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <Pill tone={recalls.length ? "warning" : "neutral"} dot>
            {recalls.length ? t(c.recallCount, { n: recalls.length }) : c.noRecalls}
          </Pill>
          <Link href={`/${lang}/results/?${search}`} className={button("primary", { small: true })}>
            <Search className="size-4" aria-hidden />
            {c.searchEngine}
          </Link>
        </div>
        {recalls.length > 0 && <p className="mt-3 text-sm text-muted">{c.genRecalls}</p>}
        <RecallList recalls={recalls} lang={lang} dict={dict} open />
      </Card>
      <p className="text-sm text-muted">{c.soonEngine}</p>
      <ReportError dict={dict} generationId={gen.id} engineId={engine.id} />
    </div>
  );
}
