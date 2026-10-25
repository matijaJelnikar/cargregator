// Search over the car guide's taxonomy (src/data/makes.ts). The guide index is the only place with a search box:
// typing a make or model narrows the list, and picking a result opens that car's page. Names are matched without
// case or diacritics, so "skoda octavia" finds "Škoda Octavia" and "id3" finds "ID.3".

import { MAKES, modelSlug, type Make, type Model } from "@/data/makes";
import type { Locale } from "./i18n";

/** Results shown at once; the query usually narrows to a handful. */
export const GUIDE_RESULTS = 8;

export interface GuideHit {
  make: Make;
  /** Missing for the make's "all models" entry. */
  model?: Model;
}

/** "Škoda" → "skoda", "ID.3" → "id 3" (diacritics and case dropped). */
function fold(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/** "ID.3" → "id3", "C-Class" → "cclass": the same name without separators. */
function compact(s: string): string {
  return fold(s).replace(/[^a-z0-9]+/g, "");
}

/** Every word of the query, so "c class" and "c-class" behave the same. */
function queryTokens(query: string): string[] {
  return fold(query).split(/[^a-z0-9]+/).filter(Boolean);
}

/** How well one query word matches a name: exact, prefix, start of a word, inside a word, or not at all. */
function tokenScore(name: string, token: string): number {
  const spaced = fold(name);
  const joined = compact(name);
  if (joined === token) return 100;
  if (joined.startsWith(token)) return 70;
  if (spaced.split(/[^a-z0-9]+/).some((word) => word.startsWith(token))) return 60;
  if (joined.includes(token)) return 40;
  if (spaced.includes(token)) return 20;
  return 0;
}

/** The make's name and the other names people type for it ("vw"). */
function makeNames(make: Make): string[] {
  return [make.name, ...(make.aliases ?? [])];
}

/** Summed score over the make's names, or null when a query word doesn't match any of them. */
function scoreMake(make: Make, tokens: string[]): number | null {
  let total = 0;
  for (const token of tokens) {
    const best = Math.max(...makeNames(make).map((name) => tokenScore(name, token)));
    if (!best) return null;
    total += best;
  }
  return total;
}

/**
 * A model matches when every query word matches either its name or its make's name, so "audi a4" and
 * "a4 audi" both work. The whole query matching a name exactly wins over a prefix, which wins over a word
 * inside it.
 */
function scoreModel(make: Make, model: Model, tokens: string[], query: string): number | null {
  let total = 0;
  for (const token of tokens) {
    const best = Math.max(tokenScore(model.name, token), ...makeNames(make).map((name) => tokenScore(name, token)));
    if (!best) return null;
    total += best;
  }
  total += 10; // A model whose own name matches beats one that only matches through its make.
  if (compact(model.name) === query) total += 500;
  else if (makeNames(make).some((name) => compact(`${name}${model.name}`) === query)) total += 400;
  return total;
}

/** Ranked makes and models for a query; an empty query has no results. */
export function searchGuide(query: string, max = GUIDE_RESULTS): GuideHit[] {
  const tokens = queryTokens(query);
  if (!tokens.length) return [];
  const q = compact(query);
  const ranked: { hit: GuideHit; score: number }[] = [];

  for (const make of MAKES) {
    const makeScore = scoreMake(make, tokens);
    if (makeScore !== null) ranked.push({ hit: { make }, score: makeScore + 50 });
    for (const model of make.models) {
      const score = scoreModel(make, model, tokens, q);
      if (score !== null) ranked.push({ hit: { make, model }, score });
    }
  }

  const label = (hit: GuideHit) => (hit.model ? `${hit.make.name} ${hit.model.name}` : hit.make.name);
  ranked.sort((a, b) => b.score - a.score || label(a.hit).localeCompare(label(b.hit)));
  return ranked.slice(0, max).map((r) => r.hit);
}

/** The guide page of a hit: a model's page, or the make's page for the "all models" entry. */
export function guideHref(lang: Locale, hit: GuideHit): string {
  return hit.model
    ? `/${lang}/avti/${hit.make.id}/${modelSlug(hit.make.id, hit.model.id)}/`
    : `/${lang}/avti/${hit.make.id}/`;
}
