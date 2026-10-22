// Step 1 of the car-info skeleton: every EEA variant of a model (data-raw/eea/groups) → one prompt that asks
// for the model's generations and engines. Answers (data-raw/carinfo/skeleton/answers) come from run-batch.ts
// and are turned into rows by skeleton.ts, which reads the variants written here.
//
//   node scripts/carinfo/skeleton-prompt.ts                    # every model
//   node scripts/carinfo/skeleton-prompt.ts volkswagen bmw-x3  # some makes or models

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { MAKES, type Make } from "../../src/data/makes.ts";
import type { Fuel } from "../../src/lib/filters.ts";
import type { Group } from "../co2/ingest.ts";
import { modelFor } from "../co2/names.ts";
import { toFuel } from "../co2/normalize.ts";

const ROOT = new URL("../../", import.meta.url);
const GROUPS = new URL("data-raw/eea/groups/", ROOT);
export const SKELETON_DIR = "data-raw/carinfo/skeleton";

/** Variants with fewer registrations over all years are typos and one-offs. */
const MIN_CARS = 20;

export interface Variant {
  id: string;
  name: string;
  type: string;
  fuel: Fuel;
  /** A hybrid with a diesel engine. */
  diesel: boolean;
  kw: number;
  cc: number | null;
  /** Registration year → cars. */
  years: Record<number, number>;
  cars: number;
}

function variantsOf(make: Make, groups: Group[]): Map<string, Variant[]> {
  const byModel = new Map<string, Map<string, Variant>>();
  for (const g of groups) {
    const kind = toFuel(g);
    if (!kind || g.kw === null) continue;
    const modelId = modelFor(make, g.cn);
    if (!modelId) continue;
    const kw = Math.round(g.kw);
    const diesel = kind.scale === "diesel" && kind.fuel !== "diesel";
    const key = [g.cn, g.t, kind.fuel, diesel, kw, g.cc].join("|");
    const model = byModel.get(modelId) ?? new Map<string, Variant>();
    byModel.set(modelId, model);
    const v = model.get(key) ?? { id: "", name: g.cn, type: g.t, fuel: kind.fuel, diesel, kw, cc: g.cc, years: {}, cars: 0 };
    v.years[g.year] = (v.years[g.year] ?? 0) + g.n;
    v.cars += g.n;
    model.set(key, v);
  }
  const out = new Map<string, Variant[]>();
  for (const [modelId, model] of byModel) {
    const list = [...model.values()].filter((v) => v.cars >= MIN_CARS).sort((a, b) => b.cars - a.cars);
    list.forEach((v, i) => (v.id = `v${i + 1}`));
    out.set(modelId, list);
  }
  return out;
}

const count = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));

function row(v: Variant): string {
  const fuel = v.fuel === "hybrid" || v.fuel === "plugin_hybrid" ? `${v.fuel} (${v.diesel ? "diesel" : "petrol"})` : v.fuel;
  const years = Object.entries(v.years)
    .map(([y, n]) => `${y.slice(2)}:${count(n)}`)
    .join(" ");
  return [v.id, v.name, v.type || "–", fuel, v.kw, v.cc ?? "–", years].join(" | ");
}

export function prompt(make: Make, modelId: string, variants: Variant[]): string {
  const model = make.models.find((m) => m.id === modelId)!;
  return `You build the generation and engine index for a Slovenian used-car guide (like carchecker.pro: one report per generation + engine). The data is EU vehicle registrations (EEA CO2 monitoring, Regulation (EU) 2019/631), 2011–2025, one row per commercial name as typed by manufacturers and national registries, so names are inconsistent. Group only the rows given; never invent engines that have no rows.

---

Model: ${make.name} ${model.name} (${modelId}).

Below is every variant registered in the EU under names that are this model: id, commercial name, EEA type code
(from the type approval; it often tells generations apart, but some makers keep one code across generations, and
it is often empty before 2013), fuel, power (kW), engine size (cc), and registrations per year ("12:20k" = 20,000
in 2012).

1. List the generations present, with their real production years (facelifts belong to their generation) and
   the type codes that belong to each.
   - name: the model and generation as buyers say it, without the make or years: "Golf VII", "3 Series (F30)",
     "Sandero II", "Octavia III".
   - slug: short and lowercase as enthusiasts write it: "mk7", "f30", "w205", "b8"; "mk1", "mk2"... when the
     generation has no common chassis name.
   - code: the chassis code if one is commonly used ("5G", "F30", "B52"), else null.
   When the type code is empty or shared by two generations, place the variant by its years, engine and power.
   A variant that spans a generation change can be split by year: "v12@2011-2011" and "v12@2012-2016".
2. Group the variants into engines. An engine is one generation + one engine at one power output:
   - Merge equipment lines, body styles (hatchback, estate, saloon, Variant, Touring), gearboxes and
     drivetrains of the same engine and power into one engine.
   - Performance versions keep their badge as the name (GTI, GTD, GTE, R, M340i, RS, AMG C 43).
   - Name the engine as buyers search for it ("1.4 TSI", "320d", "1.5 dCi", "Hybrid 1.8", "Long Range").
     Never put the power in the name: the same name at two power outputs is two engines with the same name,
     and the site shows the power next to it. Give the engine family code if it is well known (EA211, B47,
     K9K), else null.
   - Fuel and power must match within an engine: never put variants of different fuel, or kW more than
     2 apart, into one engine.
3. Every year of every variant must be used exactly once: in one engine or in "dropped" (with a short reason,
   e.g. a power or size that no ${model.name} engine had, or a different model filed under this name).

Answer with JSON only.

id | name | type | fuel | kW | cc | registrations by year
${variants.map(row).join("\n")}
`;
}

async function main() {
  const args = process.argv.slice(2);
  const makes = args.length ? MAKES.filter((m) => args.some((a) => a === m.id || a.startsWith(`${m.id}-`))) : MAKES;
  await mkdir(`${SKELETON_DIR}/prompts`, { recursive: true });
  await mkdir(`${SKELETON_DIR}/variants`, { recursive: true });
  let prompts = 0;
  const empty: string[] = [];
  for (const make of makes) {
    const groups = JSON.parse(await readFile(new URL(`${make.id}.json`, GROUPS), "utf8")) as Group[];
    const byModel = variantsOf(make, groups);
    for (const model of make.models) {
      if (args.length && !args.includes(make.id) && !args.includes(model.id)) continue;
      const variants = byModel.get(model.id);
      if (!variants?.length) {
        empty.push(model.id);
        continue;
      }
      await writeFile(`${SKELETON_DIR}/prompts/${model.id}.md`, prompt(make, model.id, variants));
      await writeFile(`${SKELETON_DIR}/variants/${model.id}.json`, JSON.stringify(variants));
      prompts++;
    }
  }
  console.log(`${prompts} prompts → ${SKELETON_DIR}/prompts`);
  if (empty.length) console.log(`No EEA rows (${empty.length}): ${empty.join(", ")}`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
