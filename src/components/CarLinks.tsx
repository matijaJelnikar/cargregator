import { ClipboardCheck, ExternalLink, Gauge, Newspaper, Search, ShieldCheck, type LucideIcon } from "lucide-react";
import { carLinks, type CarLinkId, type CarLinkInput } from "@/lib/carLinks";
import type { Dict } from "@/lib/i18n";

const ICONS: Record<CarLinkId, LucideIcon> = { tests: Newspaper, safety: ShieldCheck, adac: Gauge, tuv: ClipboardCheck };

/** Road tests, crash ratings and reliability sources for a model or one generation, as a grid of outbound cards. */
export function CarLinks({ car, dict, compact = false }: { car: CarLinkInput; dict: Dict; compact?: boolean }) {
  const c = dict.carInfo;
  const links = carLinks(car);
  if (compact) {
    return (
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
        {links.map((l) => (
          <li key={l.id}>
            <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">
              {c.link[l.id].label}
              <ExternalLink className="size-3" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {links.map((l) => {
        const Icon = ICONS[l.id];
        return (
          <li key={l.id}>
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-accent"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 font-medium group-hover:text-accent">
                  {c.link[l.id].label}
                  {l.exact ? <ExternalLink className="size-3.5 text-subtle" aria-hidden /> : <Search className="size-3.5 text-subtle" aria-label={c.searchLink} />}
                </span>
                <span className="block text-sm text-muted">{c.link[l.id].hint}</span>
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
