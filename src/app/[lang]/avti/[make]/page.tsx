import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { MakeLogo } from "@/components/MakeLogo";
import { years } from "@/components/RecallList";
import { Eyebrow } from "@/components/ui";
import { MAKES } from "@/data/makes";
import { modelSlug, modelSummaries } from "@/lib/carinfoDb";
import { alternates, t } from "@/lib/i18n";
import { getDictionary } from "../../dictionaries";

// Rendered on demand and cached, like the model pages.
export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/[lang]/avti/[make]">): Promise<Metadata> {
  const p = await params;
  const make = MAKES.find((m) => m.id === p.make);
  if (!make) return {};
  const { lang, dict } = await getDictionary(p.lang);
  return { title: `${make.name}: ${dict.carInfo.title}`, description: `${make.name}. ${dict.carInfo.intro}`, alternates: alternates(lang, `/avti/${make.id}/`) };
}

/** Step two of the car guide: pick one of the make's models. */
export default async function MakePage({ params }: PageProps<"/[lang]/avti/[make]">) {
  const p = await params;
  const { lang, dict } = await getDictionary(p.lang);
  const make = MAKES.find((m) => m.id === p.make);
  if (!make) notFound();
  const c = dict.carInfo;
  const summaries = await modelSummaries(make.id);
  const models = make.models.filter((m) => summaries.has(m.id));
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Breadcrumbs lang={lang} dict={dict} make={make} />
      <div className="flex items-center gap-4">
        <MakeLogo makeId={make.id} name={make.name} className="size-14" />
        <div>
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-tight sm:text-4xl">{make.name}</h1>
        </div>
      </div>
      <section>
        <h2 className="mb-3 text-lg font-semibold">{c.modelsTitle}</h2>
        {models.length ? (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {models.map((m) => {
              const s = summaries.get(m.id)!;
              return (
                <li key={m.id}>
                  <Link
                    href={`/${lang}/avti/${make.id}/${modelSlug(make.id, m.id)}/`}
                    className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-accent"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium group-hover:text-accent">{m.name}</span>
                      <span className="block font-mono text-xs text-muted">
                        {years(s.year_from, s.year_to, dict)} · {t(c.generations, { n: s.generations })}
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-subtle group-hover:text-accent" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted">{c.noModels}</p>
        )}
      </section>
    </div>
  );
}
