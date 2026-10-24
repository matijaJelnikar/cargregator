import type en from "@/app/[lang]/dictionaries/en.json";

export const LOCALES = ["sl", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export type Dict = typeof en;

export const hasLocale = (l: string): l is Locale => (LOCALES as readonly string[]).includes(l);

/** "Search {n} sites" + { n: 3 } → "Search 3 sites" */
export function t(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

// Plural forms in a dictionary string, separated by "|": English one|other, Slovenian one|two|few|other
// (1 generacija, 2 generaciji, 3 generacije, 5 generacij; 101 counts as one, 102 as two).
const PLURAL_ORDER: Record<Locale, Intl.LDMLPluralRule[]> = { en: ["one", "other"], sl: ["one", "two", "few", "other"] };

/** "{n} generation|{n} generations" + 1 → "1 generation" */
export function tn(template: string, n: number, lang: Locale): string {
  const forms = template.split("|");
  const i = PLURAL_ORDER[lang].indexOf(new Intl.PluralRules(lang).select(n));
  return t(forms[Math.min(i < 0 ? forms.length - 1 : i, forms.length - 1)], { n });
}

export function formatNumber(n: number, lang: Locale): string {
  return n.toLocaleString(lang === "sl" ? "sl-SI" : "en-GB");
}

export function formatDate(iso: string, lang: Locale): string {
  return new Date(iso).toLocaleDateString(lang === "sl" ? "sl-SI" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatEur(n: number, lang: Locale): string {
  return n.toLocaleString(lang === "sl" ? "sl-SI" : "en-GB", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/** The public origin, for absolute URLs (metadataBase, sitemap, structured data). */
export const SITE = "https://cars.jelnikar.dev";

/** Canonical and per-language URLs of a page, for `metadata.alternates` (path starts and ends with "/"). */
export const alternates = (lang: Locale, path: string) => ({
  canonical: `/${lang}${path}`,
  languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}${path}`])),
});
