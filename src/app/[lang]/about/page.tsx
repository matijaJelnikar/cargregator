import { FlaskConical, Link2, ShieldCheck } from "lucide-react";
import { Card, CountryCode } from "@/components/ui";
import { SITES, marketCode } from "@/lib/sites/registry";
import { getDictionary } from "../dictionaries";

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { dict } = await getDictionary((await params).lang);
  const a = dict.about;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-accent">{a.eyebrow}</span>
        <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight sm:text-4xl">{a.title}</h1>
      </div>
      <Card title={a.howTitle} icon={Link2}>
        <div className="space-y-3 leading-relaxed">
          <p>{a.p1}</p>
          <p>{a.p2}</p>
          <p>{a.p3}</p>
        </div>
        <ul className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          {SITES.map((s) => (
            <li key={s.id} className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-sm">
              <CountryCode code={marketCode(s)} />
              {s.name}
            </li>
          ))}
        </ul>
      </Card>
      <Card title={a.privacyTitle} icon={ShieldCheck}>
        <p className="leading-relaxed">{a.privacy}</p>
      </Card>
      <Card title={a.betaTitle} icon={FlaskConical}>
        <p className="leading-relaxed">{a.beta}</p>
      </Card>
    </div>
  );
}
