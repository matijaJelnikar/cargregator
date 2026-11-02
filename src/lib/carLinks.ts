// Outside sources for a model or generation. Prefer the selected generation's
// report links; use the static map for model pages and search for missing sources.

import LINK_MAP from "@/data/carLinks.json";
import type { CarLinkRow } from "@/lib/carinfoDb";

export type CarLinkId = "tests" | "safety" | "adac" | "tuv";

export interface CarLink {
  id: CarLinkId;
  url: string;
  /** False when the link is a search rather than the model's own page. */
  exact: boolean;
}

export interface CarLinkInput {
  makeId: string;
  modelId: string;
  makeName: string;
  modelName: string;
  /** Narrows safety and TÜV searches to one generation. */
  gen?: { name: string; year_from: number; ncap_url?: string | null; links?: CarLinkRow[] };
}

const MAP: Record<string, { am?: string; adac?: string; generations?: Record<string, { adac?: string; tuv?: string }> }> = LINK_MAP;
const AM_SEARCH = "https://avto-magazin.metropolitan.si/iskanje/";

const web = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

function page(value: string): URL | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.pathname === "/" || /(?:^|\/)(?:search|iskanje)(?:\/|$)/i.test(url.pathname)) return;
    return url;
  } catch {
    return;
  }
}

const article = (value: string) => {
  const url = page(value);
  return url?.hostname === "avto-magazin.metropolitan.si" && /^\/avtomobilski-testi\/[^/]+\/?$/.test(url.pathname);
};

const ncap = (value: string) => {
  const url = page(value);
  return (url?.hostname === "www.euroncap.com" || url?.hostname === "euroncap.com") && /^\/(?:[a-z]{2}\/)?(?:results|assessments)\/[^/]+\/[^/]+\/[^/]+\/?$/.test(url.pathname);
};

export function carLinks({ modelId, makeName, modelName, gen }: CarLinkInput): CarLink[] {
  const found = MAP[modelId] ?? {};
  const car = `${makeName} ${modelName}`;
  // Generation names already contain the model: "Golf VII", "3 Series (F30/F31)".
  const genCar = gen ? `${makeName} ${gen.name}` : car;
  const links = gen?.links ?? [];
  // Verified gaps in report data, scoped by model and generation start year.
  const known = gen ? found.generations?.[gen.year_from] : undefined;
  const adac = links.find((l) => {
    const url = page(l.url);
    return (url?.hostname === "www.adac.de" || url?.hostname === "adac.de")
      && url.pathname.startsWith("/rund-ums-fahrzeug/autokatalog/marken-modelle/");
  })?.url ?? known?.adac ?? found.adac;
  const am = links.find((l) => article(l.url))?.url ?? (!gen && found.am && article(found.am) ? found.am : undefined);
  const safety = gen?.ncap_url && ncap(gen.ncap_url) ? gen.ncap_url : links.find((l) => ncap(l.url))?.url;
  const tuv = links.find((l) => {
    const url = page(l.url);
    return url && !["google.com", "www.google.com", "bing.com", "www.bing.com"].includes(url.hostname)
      && /\b(?:tüv|tuv|tuev)\b/i.test(`${l.label} ${url.hostname} ${url.pathname}`);
  })?.url ?? known?.tuv;
  return [
    am ? { id: "tests", url: am, exact: true } : { id: "tests", url: `${AM_SEARCH}?q=${encodeURIComponent(genCar)}`, exact: false },
    { id: "safety", url: safety ?? web(`site:euroncap.com ${car}${gen ? ` ${gen.year_from}` : ""}`), exact: !!safety },
    adac ? { id: "adac", url: adac, exact: true } : { id: "adac", url: web(`site:adac.de autokatalog ${car}`), exact: false },
    { id: "tuv", url: tuv ?? web(`TÜV Report ${genCar} Mängel`), exact: !!tuv },
  ];
}
