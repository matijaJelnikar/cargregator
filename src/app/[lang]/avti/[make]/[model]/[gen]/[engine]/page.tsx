import { powerLabel } from "@/lib/buyingGuide";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CarLinks } from "@/components/CarLinks";
import { CarTestButton } from "@/components/CarTestButton";
import { CheckList, FailureList, ReportBadge, VerdictPill, hasReport } from "@/components/CarReport";
import { RecallList, years } from "@/components/RecallList";
import { ReportError } from "@/components/ReportError";
import { Card, Eyebrow, Pill } from "@/components/ui";
import { MAKES } from "@/data/makes";
import { getGenerations, getRelatedEngines, modelSlug, pick } from "@/lib/carinfoDb";
import { recallsInYears } from "@/lib/carinfoMatch";
import { alternates, formatEur, t, tn } from "@/lib/i18n";
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
  // An optional discovery section must not make the report unavailable.
  const related = await getRelatedEngines(engine, model.id).catch(() => []);

  // Notices that name only a few years apply to the engine only if those years overlap its own.
  const recalls = recallsInYears(gen.recalls, engine.year_from, engine.year_to);
  // A failure tied to one power output of this engine name applies to all of them.
  const sameName = new Set(gen.engines.filter((e) => e.name === engine.name).map((e) => e.id));
  const engineFailures = gen.failures.filter((f) => f.engine_id && sameName.has(f.engine_id));
  const genFailures = gen.failures.filter((f) => !f.engine_id);
  const problemCount = engineFailures.length + genFailures.length;
  const report = hasReport(gen) && engine.verdict !== null;
  const specs: [string, string][] = [
    [c.fuelCol, dict.fuel[engine.fuel]],
    [c.powerCol, engine.kw != null ? powerLabel(engine.kw, lang) : "–"],
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
        <div className="mt-3">
          <CarTestButton car={{ makeId: make.id, modelId: model.id, makeName: make.name, modelName: model.name, gen }} dict={dict} />
        </div>
      </div>
      <Card>
        {report && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <VerdictPill verdict={engine.verdict!} dict={dict} />
              {engine.score != null && <span className="font-mono text-sm text-muted">{t(c.score, { n: engine.score })}</span>}
              {engine.annual_cost_min != null && engine.annual_cost_max != null && (
                <span className="font-mono text-sm text-muted" title={c.annualCostHint}>
                  {t(c.annualCost, { min: formatEur(engine.annual_cost_min, lang), max: formatEur(engine.annual_cost_max, lang) })}
                </span>
              )}
              <span className="ml-auto">
                <ReportBadge gen={gen} lang={lang} dict={dict} />
              </span>
            </div>
            <p className="mt-3 leading-relaxed">{pick(lang, engine.summary_sl, engine.summary_en)}</p>
          </>
        )}
        <p className={report ? "mt-3 font-mono text-sm text-muted" : "font-mono text-sm text-muted"}>
          {specs
            .map(([, value]) => value)
            .filter((value) => value !== "–")
            .join(" · ")}
        </p>
        {related.length > 0 && (
          <details className="mt-4 border-t border-border pt-4">
            <summary className="cursor-pointer text-sm font-medium">{c.alsoFoundIn}</summary>
            <p className="mt-2 text-xs text-muted">{t(c.alsoFoundInHint, { code: engine.engine_code! })}</p>
            <ul className="mt-3 max-h-80 space-y-3 overflow-y-auto text-sm">
              {related.map((other) => (
                <li key={other.id}>
                  <Link href={`/${lang}${other.path}`} className="text-accent hover:underline">
                    {other.carName} · {other.generations.name} · {other.name}
                  </Link>
                  <p className="mt-0.5 font-mono text-xs text-muted">
                    {years(other.year_from, other.year_to, dict)}
                    {other.kw != null && ` · ${powerLabel(other.kw, lang)}`}
                  </p>
                </li>
              ))}
            </ul>
          </details>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <Pill tone={recalls.length ? "warning" : "neutral"} dot>
            {recalls.length ? tn(c.recallCount, recalls.length, lang) : c.noRecalls}
          </Pill>
          {problemCount > 0 && (
            <a href="#problems" className="text-sm text-accent hover:underline">
              {tn(c.problemCount, problemCount, lang)}
            </a>
          )}
        </div>
        {recalls.length > 0 && (
          <p className="mt-3 text-sm text-muted">
            {c.genRecalls} {c.recallVin}
          </p>
        )}
        <RecallList recalls={recalls} lang={lang} dict={dict} />
        {!report && <p className="mt-3 text-sm text-muted">{c.soonEngine}</p>}
      </Card>
      {problemCount > 0 && (
        <div id="problems" className="scroll-mt-20 space-y-5">
          {engineFailures.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">{c.engineFailures}</h2>
              <FailureList failures={engineFailures} gen={gen} lang={lang} dict={dict} />
            </section>
          )}
          {genFailures.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">{c.genFailures}</h2>
              <FailureList failures={genFailures} gen={gen} lang={lang} dict={dict} />
            </section>
          )}
        </div>
      )}
      {gen.checks.length > 0 && (
        <Card title={c.checksTitle}>
          <CheckList gen={gen} lang={lang} />
        </Card>
      )}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{c.linksTitle}</h2>
        <CarLinks car={{ makeId: make.id, modelId: model.id, makeName: make.name, modelName: model.name, gen }} dict={dict} compact />
      </section>
      <ReportError dict={dict} generationId={gen.id} engineId={engine.id} />
    </div>
  );
}
