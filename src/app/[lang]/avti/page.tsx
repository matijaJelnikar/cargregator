import type { Metadata } from "next";
import Link from "next/link";
import { GuideSearch } from "@/components/GuideSearch";
import { MakeLogo } from "@/components/MakeLogo";
import { Eyebrow } from "@/components/ui";
import { MAKES } from "@/data/makes";
import { alternates } from "@/lib/i18n";
import { getDictionary } from "../dictionaries";

export async function generateMetadata({ params }: PageProps<"/[lang]/avti">): Promise<Metadata> {
  const { lang, dict } = await getDictionary((await params).lang);
  return { title: `${dict.carInfo.eyebrow}: ${dict.carInfo.title}`, description: dict.carInfo.intro, alternates: alternates(lang, "/avti/") };
}

/** Step one of the car guide: pick a make. */
export default async function CarInfoIndexPage({ params }: PageProps<"/[lang]/avti">) {
  const { lang, dict } = await getDictionary((await params).lang);
  const c = dict.carInfo;
  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <Eyebrow>{c.eyebrow}</Eyebrow>
        <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight sm:text-4xl">{c.title}</h1>
        <p className="mt-3 leading-relaxed text-muted">{c.intro}</p>
        <div className="mt-5 max-w-xl">
          <GuideSearch lang={lang} dict={dict} />
        </div>
      </div>
      <section>
        <h2 className="mb-3 text-lg font-semibold">{c.makesTitle}</h2>
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
          {MAKES.map((make) => (
            <li key={make.id}>
              <Link
                href={`/${lang}/avti/${make.id}/`}
                className="flex h-full flex-col items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-4 text-center text-sm font-medium transition-colors hover:border-accent hover:text-accent"
              >
                <MakeLogo makeId={make.id} name={make.name} />
                {make.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
