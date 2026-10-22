// Step 3 of the car-info skeleton: answers (run-batch.ts) + variants (skeleton-prompt.ts) → generation and
// engine rows. Years, power, size and registrations come from the EEA variants, never from the answer.
// Writes SQL that calls carinfo.load_skeleton(), applied through the Supabase MCP, plus a review report.
//
//   node scripts/carinfo/skeleton.ts                   # every answer
//   node scripts/carinfo/skeleton.ts volkswagen-golf   # some models

import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { MAKES } from "../../src/data/makes.ts";
import { SkeletonAnswer, engineSlug } from "../../src/lib/carinfo.ts";
import { SKELETON_DIR, type Variant } from "./skeleton-prompt.ts";

const SQL_DIR = "data-raw/carinfo/sql";
/** Bytes of payload per SQL file, so each file fits one execute_sql call. */
const CHUNK = 60_000;
/** Years with fewer cars are leftovers (late registrations, imports) and don't set an engine's years. */
const MIN_YEAR_CARS = 50;
/** Most kW apart the variants of one engine may be. */
const KW_SPREAD = 2;

type GenRow = [slug: string, name: string, code: string | null, from: number, to: number | null, cars: number];
type EngineRow = [gen: string, slug: string, name: string, code: string | null, fuel: string, kw: number, ccm: number | null, from: number, to: number, cars: number];
interface Payload {
  model_id: string;
  generations: GenRow[];
  engines: EngineRow[];
}

/** "v12@2012-2016" → the variant's registrations in those years. */
function yearsOf(ref: string, variants: Map<string, Variant>): [Variant, [number, number][]] | undefined {
  const [id, range] = ref.split("@");
  const v = variants.get(id);
  if (!v) return undefined;
  const [from, to] = range ? range.split("-").map(Number) : [0, 9999];
  return [v, Object.entries(v.years).map(([y, n]) => [Number(y), n] as [number, number]).filter(([y]) => y >= from && y <= to)];
}

const top = <T>(counts: Map<T, number>): T => [...counts].sort((a, b) => b[1] - a[1])[0][0];

function build(modelId: string, answer: SkeletonAnswer, list: Variant[], issues: string[]): Payload {
  const variants = new Map(list.map((v) => [v.id, v]));
  const used = new Map<string, number>(); // "v12|2014" → times used

  const genSlugs = new Set(answer.generations.map((g) => g.slug));
  const engines: EngineRow[] = [];
  const genCars = new Map<string, number>();
  const slugs = new Set<string>();

  for (const e of answer.engines) {
    if (!genSlugs.has(e.generation)) {
      issues.push(`${e.name}: unknown generation "${e.generation}", skipped`);
      continue;
    }
    const fuel = new Map<string, number>();
    const kw = new Map<number, number>();
    const cc = new Map<number | null, number>();
    const years = new Map<number, number>();
    for (const ref of e.variants) {
      const found = yearsOf(ref, variants);
      if (!found) {
        issues.push(`${e.name}: unknown variant ${ref}`);
        continue;
      }
      const [v, ys] = found;
      for (const [y, n] of ys) {
        const key = `${v.id}|${y}`;
        used.set(key, (used.get(key) ?? 0) + 1);
        years.set(y, (years.get(y) ?? 0) + n);
        fuel.set(v.fuel, (fuel.get(v.fuel) ?? 0) + n);
        kw.set(v.kw, (kw.get(v.kw) ?? 0) + n);
        cc.set(v.cc, (cc.get(v.cc) ?? 0) + n);
      }
    }
    if (!years.size) continue;
    if (fuel.size > 1) issues.push(`${e.generation} ${e.name}: mixed fuels ${[...fuel.keys()].join("/")}`);
    const kws = [...kw.keys()];
    if (Math.max(...kws) - Math.min(...kws) > KW_SPREAD) issues.push(`${e.generation} ${e.name}: kW ${kws.join("/")}`);

    const power = top(kw);
    let slug = engineSlug(e.name, power);
    for (let i = 2; slugs.has(`${e.generation}/${slug}`); i++) slug = `${engineSlug(e.name, power)}-${i}`;
    slugs.add(`${e.generation}/${slug}`);

    const cars = [...years.values()].reduce((a, b) => a + b, 0);
    const solid = [...years].filter(([, n]) => n >= MIN_YEAR_CARS).map(([y]) => y);
    const span = solid.length ? solid : [...years.keys()];
    engines.push([e.generation, slug, e.name, e.engine_code, top(fuel), power, top(cc), Math.min(...span), Math.max(...span), cars]);
    genCars.set(e.generation, (genCars.get(e.generation) ?? 0) + cars);
  }

  for (const d of answer.dropped) {
    const found = yearsOf(d.variant, variants);
    if (!found) issues.push(`dropped: unknown variant ${d.variant}`);
    else for (const [y] of found[1]) used.set(`${found[0].id}|${y}`, (used.get(`${found[0].id}|${y}`) ?? 0) + 1);
  }
  for (const v of list) {
    for (const y of Object.keys(v.years)) {
      const n = used.get(`${v.id}|${y}`) ?? 0;
      if (n !== 1) issues.push(`${v.id} ${y} (${v.name}, ${v.kw} kW, ${v.years[Number(y)]} cars): used ${n}×`);
    }
  }

  const generations: GenRow[] = answer.generations.map((g) => [
    g.slug,
    g.name,
    g.code,
    g.year_from,
    g.year_to,
    genCars.get(g.slug) ?? 0,
  ]);
  return { model_id: modelId, generations, engines };
}

const dollarQuote = (json: string) => `$json$${json}$json$`;

async function main() {
  const only = process.argv.slice(2);
  const modelIds = new Set(MAKES.flatMap((m) => m.models.map((x) => x.id)));
  const ids = (await readdir(`${SKELETON_DIR}/answers`))
    .map((f) => f.replace(/\.json$/, ""))
    .filter((id) => (only.length ? only.includes(id) : true));

  const payloads: Payload[] = [];
  const report: string[] = [`# Car-info skeleton report\n\n${ids.length} models; generated ${new Date().toISOString().slice(0, 10)}.\n`];
  for (const id of ids) {
    if (!modelIds.has(id)) {
      report.push(`## ${id}\n- not in MAKES, skipped\n`);
      continue;
    }
    const answer = SkeletonAnswer.parse(JSON.parse(await readFile(`${SKELETON_DIR}/answers/${id}.json`, "utf8")));
    const variants = JSON.parse(await readFile(`${SKELETON_DIR}/variants/${id}.json`, "utf8")) as Variant[];
    const issues: string[] = [];
    const p = build(id, answer, variants, issues);
    payloads.push(p);
    report.push(`## ${id}\n${p.generations.length} generations, ${p.engines.length} engines`);
    if (issues.length) report.push(issues.map((i) => `- ${i}`).join("\n"));
    report.push("");
  }

  await mkdir(SQL_DIR, { recursive: true });
  const files: string[][] = [[]];
  let size = 0;
  for (const p of payloads) {
    const json = JSON.stringify(p);
    if (size + json.length > CHUNK && files.at(-1)!.length) {
      files.push([]);
      size = 0;
    }
    files.at(-1)!.push(json);
    size += json.length;
  }
  for (const [i, chunk] of files.entries()) {
    if (!chunk.length) continue;
    const sql = `select carinfo.load_skeleton(${dollarQuote(`[${chunk.join(",\n")}]`)}::jsonb);\n`;
    await writeFile(`${SQL_DIR}/skeleton-${String(i + 1).padStart(3, "0")}.sql`, sql);
  }
  await writeFile(`${SKELETON_DIR}/report.md`, report.join("\n"));
  console.log(`${payloads.length} models → ${files.length} files in ${SQL_DIR}; report in ${SKELETON_DIR}/report.md`);
}

await main();
