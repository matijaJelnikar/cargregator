import { notFound } from "next/navigation";
import { hasLocale, type Dict, type Locale } from "@/lib/i18n";

const dictionaries: Record<Locale, () => Promise<Dict>> = {
  en: () => import("./dictionaries/en.json").then((m) => m.default),
  sl: () => import("./dictionaries/sl.json").then((m) => m.default),
};

export async function getDictionary(lang: string): Promise<{ lang: Locale; dict: Dict }> {
  if (!hasLocale(lang)) notFound();
  return { lang, dict: await dictionaries[lang]() };
}
