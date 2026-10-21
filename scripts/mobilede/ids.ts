// mobile.de make and model ids for our taxonomy (src/data/makes.ts), from mobile.de's own reference lists:
//   https://m.mobile.de/svc/r/makes/Car
//   https://m.mobile.de/svc/r/models/<makeId>   ("g": a group of models, "p": the group a model belongs to)
// Writes src/lib/sites/mobilede-ids.json and lists what it couldn't match.
//
//   node scripts/mobilede/ids.ts

import { writeFile } from "node:fs/promises";
import { MAKES } from "../../src/data/makes.ts";

interface Entry {
  i: number;
  n: string;
  g?: boolean;
  p?: number;
}

const BASE = "https://m.mobile.de/svc/r";
const OUTPUT = new URL("../../src/lib/sites/mobilede-ids.json", import.meta.url);

// Our name → mobile.de's, where the plain rules below don't find it.
const MAKE_ALIASES: Record<string, string> = { ds: "DS Automobiles" };
const MODEL_ALIASES: Record<string, string> = {
  "lexus-ct": "CT 200h",
  "subaru-wrx": "WRX STI",
};

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * The names mobile.de may list one of ours under: German series names ("3 Series" → "3er Reihe", "A-Class" →
 * "A-Klasse") and its group suffixes ("CLA-Klasse", "IS-Serie", "Clubman Serie", "911er Reihe").
 */
function candidates(name: string): string[] {
  const base = name.replace(/^(\d) Series$/, "$1").replace(/-Class$/, "");
  return [name, `${base}er Reihe`, `${base}-Klasse`, `${base}-Serie`, `${base} Serie`];
}

/** "Ka/Ka+" → Ka, Ka+; "Crossland (X)" → also Crossland; "(SX4) S-Cross" → also S-Cross. */
const spellings = (theirs: string) =>
  theirs.split(/\s*\/\s*/).flatMap((alt) => [alt, alt.replace(/\s*\([^)]*\)\s*/g, " ").trim()]);

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

const { makes: theirMakes } = await get<{ makes: Entry[] }>("makes/Car");
const out = { makes: {} as Record<string, string>, models: {} as Record<string, string>, groups: {} as Record<string, string> };
const unmatched: string[] = [];

for (const make of MAKES) {
  const theirMake = theirMakes.find((m) => norm(m.n) === norm(MAKE_ALIASES[make.id] ?? make.name));
  if (!theirMake) {
    unmatched.push(`make ${make.id} (${make.name})`);
    continue;
  }
  out.makes[make.id] = String(theirMake.i);
  const { models } = await get<{ models: Entry[] }>(`models/${theirMake.i}`);
  const named = (e: Entry, name: string) => spellings(e.n).some((alt) => norm(alt) === norm(name));
  const ours = new Set(make.models.map((m) => norm(m.name)));

  for (const model of make.models) {
    const names = MODEL_ALIASES[model.id] ? [MODEL_ALIASES[model.id]] : candidates(model.name);
    const group = models.find((e) => e.g && names.some((n) => named(e, n)));
    const single = models.find((e) => !e.g && names.some((n) => named(e, n)));
    // A group sharing a model's name ("Passat": Passat, Passat Variant, Alltrack…) is what the user means unless
    // we list its other models separately ("Golf": we have Golf Plus and Golf Sportsvan too).
    const othersListed =
      group && models.filter((e) => e.p === group.i && !named(e, model.name)).every((e) => ours.has(norm(e.n)));
    if (group && !(single && othersListed)) out.groups[model.id] = String(group.i);
    else if (single) out.models[model.id] = String(single.i);
    else unmatched.push(`model ${model.id} (${model.name})`);
  }
}

await writeFile(OUTPUT, JSON.stringify(out, null, 2) + "\n");
console.log(
  `${Object.keys(out.makes).length} makes, ${Object.keys(out.models).length} models, ${Object.keys(out.groups).length} groups → ${OUTPUT.pathname}`,
);
if (unmatched.length) console.log(`Unmatched (add to the aliases or leave unmapped):\n  ${unmatched.join("\n  ")}`);
