import { TriangleAlert } from "lucide-react";
import type { CarRecall } from "@/lib/carinfoDb";
import type { Dict, Locale } from "@/lib/i18n";

export const years = (from: number | null, to: number | null, dict: Dict) => (from === null ? "–" : `${from}–${to ?? dict.carInfo.present}`);

/** Recalls with a link to the authority's own notice; collapsed by default. */
export function RecallList({ recalls, lang, dict, open = false }: { recalls: CarRecall[]; lang: Locale; dict: Dict; open?: boolean }) {
  if (!recalls.length) return null;
  return (
    <details open={open} className="mt-4 border-t border-border pt-4">
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <TriangleAlert className="size-4 text-warning" aria-hidden />
        {dict.carInfo.recallsTitle} ({recalls.length})
      </summary>
      <ul className="mt-3 space-y-2 text-sm">
        {recalls.map((r) => (
          <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <a href={r.source_url} target="_blank" rel="noopener noreferrer" className="text-accent underline-offset-2 hover:underline">
              {(lang === "sl" ? r.title_sl : null) ?? r.title_en}
            </a>
            <span className="font-mono text-xs text-subtle">
              {r.authority} · {years(r.year_from, r.year_to, dict)}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
