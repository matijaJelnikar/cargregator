import type { MetadataRoute } from "next";
import { MAKES } from "@/data/makes";
import { modelSlug } from "@/lib/carinfoDb";
import { LOCALES, SITE } from "@/lib/i18n";

/** The app's pages and every make's and model's guide page, each in both languages with its hreflang alternates. */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/check/",
    "/about/",
    "/avti/",
    ...MAKES.flatMap((make) => [`/avti/${make.id}/`, ...make.models.map((m) => `/avti/${make.id}/${modelSlug(make.id, m.id)}/`)]),
  ];
  return paths.flatMap((path) =>
    LOCALES.map((lang) => ({
      url: `${SITE}/${lang}${path}`,
      alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE}/${l}${path}`])) },
    })),
  );
}
