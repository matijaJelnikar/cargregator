import { failureWeight, type CarEngine, type CarFailure } from "./carinfoDb";
import { kwToHp } from "./filters";
import type { Locale } from "./i18n";

/** Extract whole sentences without cutting decimal engine sizes or power figures. */
export function summaryPreview(text: string, lang: Locale): { lead: string; rest: string } {
  const sentences = [...new Intl.Segmenter(lang, { granularity: "sentence" }).segment(text.trim())].map((x) => x.segment);
  return { lead: sentences.slice(0, 2).join("").trim(), rest: sentences.slice(2).join("").trim() };
}

/** Keep verdicts on exact variants; never promote an issues/avoid engine to a good choice. */
export function engineShortlist(engines: CarEngine[]): { choices: CarEngine[]; caution: CarEngine[] } {
  const rank = { recommended: 0, ok: 1, issues: 2, avoid: 3 };
  const assessed = engines.filter((e) => e.verdict);
  const positive = assessed.filter((e) => e.verdict === "recommended" || e.verdict === "ok")
    .sort((a, b) => rank[a.verdict!] - rank[b.verdict!] || (b.score ?? -1) - (a.score ?? -1) || b.registrations - a.registrations);
  const caution = assessed.filter((e) => e.verdict === "avoid" || e.verdict === "issues")
    .sort((a, b) => rank[b.verdict!] - rank[a.verdict!] || (a.score ?? 11) - (b.score ?? 11) || b.registrations - a.registrations);
  const distinct = (list: CarEngine[], limit: number) => {
    const names = new Set<string>();
    return list.filter((e) => {
      if (names.has(e.name)) return false;
      names.add(e.name);
      return true;
    }).slice(0, limit);
  };
  return { choices: distinct(positive, 2), caution: distinct(caution, 1) };
}

/** Match the existing probability × upper repair-cost ordering. */
export const priorityRisks = (failures: CarFailure[]) => [...failures].sort((a, b) => failureWeight(b) - failureWeight(a)).slice(0, 3);

/** Metric horsepower, using the same conversion as the search filters. */
export const powerLabel = (kw: number, lang: Locale) => `${kw} kW (${kwToHp(kw)} ${lang === "sl" ? "KM" : "hp"})`;
