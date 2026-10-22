// Skeleton for the models without EEA registrations (pickups, vans, pre-2011 models): the generations and engines
// come from the model's own knowledge, so they are less reliable than the EEA-backed ones and carry no
// registration counts. Answers go to data-raw/carinfo/skeleton/knowledge, SQL for carinfo.load_skeleton() to
// data-raw/carinfo/sql/knowledge.sql.
//
//   node scripts/carinfo/knowledge.ts [--model sonnet|opus]     # the models that have no skeleton prompt
//   node scripts/carinfo/knowledge.ts audi-a2                   # some models (re-answers them)

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { MAKES } from "../../src/data/makes.ts";
import { KnowledgeAnswer, engineSlug } from "../../src/lib/carinfo.ts";
import { SKELETON_DIR } from "./skeleton-prompt.ts";
import { ask, jsonSchema } from "./run-claude.ts";

const DIR = `${SKELETON_DIR}/knowledge`;
const SCHEMA = jsonSchema(KnowledgeAnswer);

function prompt(make: string, model: string): string {
  return `You build the generation and engine index for a Slovenian used-car guide (like carchecker.pro: one report per generation + engine). For the model below there are no registration data, so use your own knowledge of the models sold in Europe. Include only what you are sure existed; leave out engines you are unsure about rather than guessing.

Model: ${make} ${model}.

1. List the generations sold in Europe, with their real production years (facelifts belong to their generation).
   - name: the model and generation as buyers say it, without the make or years: "Golf VII", "Hilux VIII".
   - slug: short and lowercase as enthusiasts write it: "mk7", "f30", "b8"; "mk1", "mk2"... when the generation has
     no common chassis name.
   - code: the chassis code if one is commonly used, else null.
   - year_to: null if still in production.
2. List the engines of each generation as sold in Europe. An engine is one generation + one engine at one power output:
   - Merge equipment lines, body styles, gearboxes and drivetrains of the same engine and power into one engine.
   - Performance versions keep their badge as the name (GTI, RS, AMG).
   - Name the engine as buyers search for it ("1.4 TSI", "320d", "1.5 dCi", "2.4 D-4D"). Never put the power in
     the name: the same name at two power outputs is two engines with the same name. Give the engine family code
     if it is well known, else null.
   - kw: power in kW; ccm: displacement in cc (null for electric); year_from/year_to: years the engine was sold in
     Europe within its generation.
   - fuel: one of petrol, diesel, hybrid, plugin_hybrid, electric, lpg, cng.

Answer with JSON only.
`;
}

function check(a: KnowledgeAnswer): string[] {
  const issues: string[] = [];
  const gens = new Set(a.generations.map((g) => g.slug));
  for (const e of a.engines) {
    if (!gens.has(e.generation)) issues.push(`${e.name}: unknown generation "${e.generation}"`);
    if (e.year_to < e.year_from) issues.push(`${e.name}: years ${e.year_from}-${e.year_to}`);
  }
  return issues;
}

async function main() {
  const args = process.argv.slice(2);
  const i = args.indexOf("--model");
  const model = i === -1 ? "sonnet" : args.splice(i, 2)[1];

  const all = MAKES.flatMap((make) => make.models.map((m) => ({ make: make.name, id: m.id, name: m.name })));
  const wanted = args.length ? all.filter((m) => args.includes(m.id)) : all.filter((m) => !existsSync(`${SKELETON_DIR}/prompts/${m.id}.md`));
  await mkdir(DIR, { recursive: true });

  const payloads: string[] = [];
  const failed: string[] = [];
  for (const m of wanted) {
    const file = `${DIR}/${m.id}.json`;
    if (args.length || !existsSync(file)) {
      try {
        const res = await ask(prompt(m.make, m.name), model, SCHEMA);
        const parsed = KnowledgeAnswer.safeParse(res.structured_output);
        if (!parsed.success) throw new Error(res.is_error ? String(res.result) : parsed.error.message);
        if (res.is_error) throw new Error(String(res.result));
        const issues = check(parsed.data);
        if (issues.length) throw new Error(issues.join("; "));
        await writeFile(file, JSON.stringify(parsed.data, null, 2));
      } catch (e) {
        failed.push(m.id);
        console.log(`${m.id} FAILED: ${(e as Error).message.slice(0, 300)}`);
        continue;
      }
    }
    const a = KnowledgeAnswer.parse(JSON.parse(await readFile(file, "utf8")));
    const slugs = new Set<string>();
    const engines = a.engines.map((e) => {
      let slug = engineSlug(e.name, e.kw);
      for (let n = 2; slugs.has(`${e.generation}/${slug}`); n++) slug = `${engineSlug(e.name, e.kw)}-${n}`;
      slugs.add(`${e.generation}/${slug}`);
      return [e.generation, slug, e.name, e.engine_code, e.fuel, e.kw, e.ccm, e.year_from, e.year_to, 0];
    });
    const generations = a.generations.map((g) => [g.slug, g.name, g.code, g.year_from, g.year_to, 0]);
    payloads.push(JSON.stringify({ model_id: m.id, generations, engines }));
    console.log(`${m.id}: ${generations.length} generations, ${engines.length} engines`);
  }

  await writeFile("data-raw/carinfo/sql/knowledge.sql", `select carinfo.load_skeleton($json$[${payloads.join(",\n")}]$json$::jsonb);\n`);
  console.log(`${payloads.length} models → data-raw/carinfo/sql/knowledge.sql${failed.length ? `; failed: ${failed.join(" ")}` : ""}`);
}

await main();
