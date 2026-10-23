import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Make, Model } from "@/data/makes";
import { SITE, type Dict, type Locale } from "@/lib/i18n";

/** Car guide trail: All makes › Volkswagen › Touareg (the last item is the current page). */
export function Breadcrumbs({ lang, dict, make, model }: { lang: Locale; dict: Dict; make: Make; model?: Model }) {
  const c = dict.carInfo;
  const crumbs = [
    { href: `/${lang}/avti/`, label: c.allMakes },
    ...(model ? [{ href: `/${lang}/avti/${make.id}/`, label: make.name }] : []),
  ];
  // The same trail as structured data, so search results can show it.
  const items = [...crumbs, { href: model ? `/${lang}/avti/${make.id}/${model.id.slice(make.id.length + 1)}/` : `/${lang}/avti/${make.id}/`, label: model ? model.name : make.name }];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.label, item: `${SITE}${it.href}` })),
  };
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted">
      {crumbs.map((cr) => (
        <span key={cr.href} className="inline-flex items-center gap-1">
          <Link href={cr.href} className="hover:text-foreground">
            {cr.label}
          </Link>
          <ChevronRight className="size-3.5 text-subtle" aria-hidden />
        </span>
      ))}
      <span className="text-foreground">{model ? model.name : make.name}</span>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </nav>
  );
}
