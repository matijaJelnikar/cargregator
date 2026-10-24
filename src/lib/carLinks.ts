// Outside sources for a model or generation: road tests, crash tests and reliability data. Exact pages come from
// src/data/carLinks.json (probed by scripts/carinfo/link-map.ts); anything without a known page becomes a search.

import LINK_MAP from "@/data/carLinks.json";

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
  gen?: { name: string; year_from: number };
}

const MAP: Record<string, { am?: string; adac?: string }> = LINK_MAP;
const AM_SEARCH = "https://avto-magazin.metropolitan.si/iskanje/";

const web = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

export function carLinks({ modelId, makeName, modelName, gen }: CarLinkInput): CarLink[] {
  const found = MAP[modelId] ?? {};
  const car = `${makeName} ${modelName}`;
  // Generation names already contain the model: "Golf VII", "3 Series (F30/F31)".
  const genCar = gen ? `${makeName} ${gen.name}` : car;
  return [
    found.am ? { id: "tests", url: found.am, exact: true } : { id: "tests", url: `${AM_SEARCH}?q=${encodeURIComponent(car)}`, exact: false },
    { id: "safety", url: web(`site:euroncap.com ${car}${gen ? ` ${gen.year_from}` : ""}`), exact: false },
    found.adac ? { id: "adac", url: found.adac, exact: true } : { id: "adac", url: web(`site:adac.de autokatalog ${car}`), exact: false },
    { id: "tuv", url: web(`TÜV Report ${genCar} Mängel`), exact: false },
  ];
}
