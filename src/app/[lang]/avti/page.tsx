import type { Metadata } from "next";
import Link from "next/link";
import { Card, Eyebrow } from "@/components/ui";
import { MAKES } from "@/data/makes";
import { generationCounts, modelSlug } from "@/lib/carinfoDb";
import { alternates, t } from "@/lib/i18n";
import { getDictionary } from "../dictionaries";

export async function generateMetadata({ params }: PageProps<"/[lang]/avti">): Promise<Metadata> {
  const { lang, dict } = await getDictionary((await params).lang);
  return { title: `${dict.carInfo.eyebrow}: ${dict.carInfo.title}`, description: dict.carInfo.intro, alternates: alternates(lang, "/avti/") };
}

export default async function CarInfoIndexPage({ params }: PageProps<"/[lang]/avti">) {
  const { lang, dict } = await getDictionary((await params).lang);
  const c = dict.carInfo;
  const counts = await generationCounts();
  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <Eyebrow>{c.eyebrow}</Eyebrow>
        <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight sm:text-4xl">{c.title}</h1>
        <p className="mt-3 leading-relaxed text-muted">{c.intro}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MAKES.map((make) => (
          <Card key={make.id} title={make.name}>
            <ul className="flex flex-wrap gap-2">
              {make.models
                .filter((m) => counts.get(m.id))
                .map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/${lang}/avti/${make.id}/${modelSlug(make.id, m.id)}/`}
                      title={t(c.generations, { n: counts.get(m.id) ?? 0 })}
                      className="inline-flex rounded-full border border-border px-2.5 py-1 text-sm transition-colors hover:border-accent hover:text-accent"
                    >
                      {m.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
