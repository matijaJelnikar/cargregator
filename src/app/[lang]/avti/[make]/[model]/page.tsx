import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { hasReport } from "@/components/CarReport";
import { GenerationProvider } from "@/components/GenerationSwitch";
import { ModelHero } from "@/components/ModelHero";
import { years } from "@/components/RecallList";
import { ReportError } from "@/components/ReportError";
import { Eyebrow } from "@/components/ui";
import { MAKES } from "@/data/makes";
import { getGenerations, modelSlug, pick } from "@/lib/carinfoDb";
import { alternates, tn } from "@/lib/i18n";
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
        <ModelHero key={last.id} name={name} makeId={make.id} modelId={model.id} makeName={make.name} modelName={model.name} gens={generations} lang={lang} dict={dict} />
      </GenerationProvider>

      <ReportError dict={dict} />
    </div>
  );
}
