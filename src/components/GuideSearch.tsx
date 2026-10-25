"use client";

import { useRouter } from "next/navigation";
import { guideHref } from "@/lib/guideSearch";
import type { Dict, Locale } from "@/lib/i18n";
import { CarSearch } from "./CarSearch";

/** The guide's search: type a make or model, then pick a car to open its page. */
export function GuideSearch({ lang, dict }: { lang: Locale; dict: Dict }) {
  const c = dict.carInfo;
  const router = useRouter();

  return (
    <CarSearch
      dict={dict}
      label={c.searchTitle}
      placeholder={c.searchPlaceholder}
      noResults={c.searchNoResults}
      onPick={(hit) => router.push(guideHref(lang, hit))}
    />
  );
}
