// Written reports, one per generation: an AI runner (Claude Code or OpenCode Go) researches the generation with
// web search/fetch and answers ReportAnswer (summary, pros/cons, engine verdicts, known failures with sources,
// checklist, exact outside links, Euro NCAP rating). Generations that already have an answer are skipped, so a run cut
// short by subscription limits resumes when started again. Nothing is written to Supabase here: verify.ts checks the
// answers and import.ts turns checked answers into SQL.
//
//   node scripts/carinfo/report.ts volkswagen-golf/mk7                  # one generation, default Claude/Sonnet
//   node scripts/carinfo/report.ts volkswagen-golf dacia-duster         # every generation of these models
//   node scripts/carinfo/report.ts --pilot                              # the pilot models (PILOT below)
//   node scripts/carinfo/report.ts --all                                # every generation, most registered first
//   node scripts/carinfo/report.ts --all --tail                         # least registered first, so a second runner
//                                                                       # (OpenCode) meets the first in the middle
//   node scripts/carinfo/report.ts --model opus --jobs 2 ...            # model alias (default sonnet), parallel calls
//   node scripts/carinfo/report.ts --runner opencode --model opencode-go/kimi-k3 skoda-fabia

import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { ReportAnswer } from "../../src/lib/carinfo.ts";
import { MAKES } from "../../src/data/makes.ts";
import LINK_MAP from "../../src/data/carLinks.json" with { type: "json" };
import { ask, assertOpencodeModel, type Runner } from "./llm.ts";

export const REPORT_DIR = "data-raw/carinfo/reports";
const ANSWERS = `${REPORT_DIR}/answers`;
const ERRORS = `${REPORT_DIR}/errors`;
const PROMPTS = `${REPORT_DIR}/prompts`;
const REST = "https://wblmhgmotllxffpwsmhb.supabase.co/rest/v1";
const KEY = "sb_publishable_f3QEE0kxL0E7HqB2CWMRTg_-Dc-aOb4";
const TOOLS = ["WebSearch", "WebFetch"];
const TIMEOUT_MS = 30 * 60_000;

export const PILOT = [
  "volkswagen-golf", "skoda-octavia", "renault-clio", "renault-megane", "bmw-3-series", "audi-a4", "volkswagen-passat",
  "ford-focus", "opel-corsa", "opel-astra", "peugeot-308", "dacia-sandero", "dacia-duster", "hyundai-i30", "kia-ceed",
  "toyota-yaris", "mercedes-benz-c-class", "skoda-fabia", "volkswagen-tiguan", "nissan-qashqai", "kia-sportage",
  "skoda-superb", "renault-captur", "ford-kuga", "tesla-model-3",
];

const SYSTEM = `You are an independent used-car expert writing for buyers in Slovenia and the rest of Europe.
You research with web search before answering and only state what your sources support. Write every text in your
own words (never copy sentences) in both Slovenian (sl, natural, not literal translation) and English (en).
Answer with JSON matching the given schema only.`;

export interface DbGen {
  id: string;
  model_id: string;
  slug: string;
  name: string;
  code: string | null;
  registrations: number;
  year_from: number;
  year_to: number | null;
  engines: { name: string; fuel: string; kw: number | null; year_from: number | null; year_to: number | null; engine_code: string | null }[];
  recalls: { title_en: string; year_from: number | null; year_to: number | null }[];
}

/** Generations of these models, or of every model when modelIds is empty. */
export async function loadGenerations(modelIds: string[]): Promise<DbGen[]> {
  const select = "id,model_id,slug,name,code,registrations,year_from,year_to,engines(name,fuel,kw,year_from,year_to,engine_code),recalls(title_en,year_from,year_to)";
  const res = await fetch(`${REST}/generations?select=${select}${modelIds.length ? `&model_id=in.(${modelIds.map(encodeURIComponent).join(",")})` : ""}&order=model_id,year_from`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Accept-Profile": "carinfo" },
  });
  if (!res.ok) throw new Error(`generations: ${res.status}`);
  return (await res.json()) as DbGen[];
}

export function carName(modelId: string): { make: string; model: string } {
  for (const m of MAKES) for (const mo of m.models) if (mo.id === modelId) return { make: m.name, model: mo.name };
  return { make: "", model: modelId };
}

/** Engine names with their fuels, power range and years, as the report's engine list. */
export function engineNames(gen: DbGen) {
  const by = new Map<string, { fuel: Set<string>; kw: number[]; from: number; to: number; codes: Set<string> }>();
  for (const e of gen.engines) {
    const x = by.get(e.name) ?? { fuel: new Set(), kw: [], from: 9999, to: 0, codes: new Set() };
    x.fuel.add(e.fuel);
    if (e.kw) x.kw.push(e.kw);
    x.from = Math.min(x.from, e.year_from ?? gen.year_from);
    x.to = Math.max(x.to, e.year_to ?? gen.year_to ?? new Date().getFullYear());
    if (e.engine_code) x.codes.add(e.engine_code);
    by.set(e.name, x);
  }
  return [...by].map(([name, x]) => ({
    name,
    line: `- ${name}${x.codes.size ? ` (${[...x.codes].join("/")})` : ""}: ${[...x.fuel].join("/")}, ${x.kw.length ? `${Math.min(...x.kw)}–${Math.max(...x.kw)} kW` : "power unknown"}, ${x.from}–${x.to}`,
  }));
}

/** Pages we already know exist for the model (scripts/carinfo/link-map.ts). */
function startingPoints(modelId: string): string {
  const known = (LINK_MAP as Record<string, { am?: string; adac?: string }>)[modelId] ?? {};
  return [
    known.am
      ? `- Avto magazin model page (lists its road tests and news): ${known.am}. Open it and add the test(s) of this generation to links (kind "test").`
      : `- Avto magazin: search "site:avto-magazin.metropolitan.si test" with the model name; add tests of this generation to links.`,
    known.adac ? `- ADAC Autokatalog: ${known.adac} (generations, tests, breakdown notes).` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function reportPrompt(gen: DbGen): string {
  const { make, model } = carName(gen.model_id);
  const years = `${gen.year_from}–${gen.year_to ?? "today"}`;
  const engines = engineNames(gen);
  const recalls = gen.recalls.slice(0, 15).map((r) => `- ${r.title_en} (${r.year_from ?? "?"}–${r.year_to ?? "?"})`);
  return `# Used-car report: ${make} ${gen.name}${gen.code && !gen.name.includes(gen.code) ? ` (${gen.code})` : ""}, ${years}

Research this generation of the ${make} ${model} and write a buyer's report.

## Engines sold in Europe (from EU registration data)
${engines.map((e) => e.line).join("\n")}

## EU Safety Gate recalls we already show (do not repeat them as failures unless they are a wider known problem)
${recalls.length ? recalls.join("\n") : "- none"}

## Starting points
${startingPoints(gen.model_id)}
- Euro NCAP: search "euroncap.com ${make} ${model} ${gen.year_from}" (or the facelift year) and open the result page
  with WebFetch. The site moved: old "/results/<make>/<model>/<id>" URLs are dead, current pages look like
  "https://www.euroncap.com/en/assessments/<make>/<model>/<id>/". Use a URL only if it loads and shows this car.
  A generation tested before 2009 or never tested gets ncap null.

## How to research
- Search the web before writing. Good sources: ADAC Pannenstatistik and Autokatalog, TÜV-Report / AutoBild TÜV,
  auto motor und sport, Avto magazin (avto-magazin.metropolitan.si), Honest John, What Car? reliability, Carwow,
  Which?, owner forums and well-known specialist garages. Prefer sources that name this generation or its years.
- Readers are Slovenian: when Avto magazin, Honest John or What Car? cover this generation, cite them in preference
  to a German source that says the same.
- Read (WebFetch) the pages you cite. Cite only URLs you actually opened and that are about this car.
- Use at least 3 different websites across the report; a failure backed by two sites is better than one.
- Keep it to about 12 searches and 12 page reads.

## What to write
- summary: 2–4 sentences: what the car is, who it suits, how it has aged as a used buy.
- pros / cons: 3–5 each, short, specific to this generation (not generic "good handling").
- engines: one entry per engine name above, using exactly the name given. verdict: "avoid" only for engines with a
  documented pattern of expensive failures; "recommended" for the best choices. score 1–10. annual_cost_min/max:
  typical yearly service + repairs in EUR for a 6–10 year old car in Slovenia (fuel and insurance excluded), null if
  you cannot estimate. summary: one or two sentences.
- failures: the known, recurring problems a buyer should know (typically 4–10). area is one of engine, gearbox,
  electrics, suspension, body, emissions. engine: an engine name from the list when specific to it, else null.
  title (short), body (what fails and why, 1–3 sentences), symptoms (what a buyer can notice), years when known,
  likelihood low/med/high, repair cost range in EUR at an independent garage in Slovenia, sources: at least one.
- checks: 4–8 things to check on a viewing or test drive, most important first.
- links: exact pages about this generation (not the model pages listed under starting points): the Avto magazin
  road test article(s) of this generation if they exist, the Euro NCAP result page, the
  ADAC Autokatalog or test page, a TÜV report page, a good review. kind: test, safety, reliability, review, forum,
  other. Only URLs you opened.
- ncap: the Euro NCAP rating of this generation (stars, test year, euroncap.com result URL), null if not tested.
- confidence: 0–1, how well your sources covered this exact generation.
`;
}

function option(name: string, fallback: string, args: string[]): string {
  const i = args.indexOf(name);
  if (i === -1) return fallback;
  const [, value] = args.splice(i, 2);
  return value;
}

async function main() {
  const args = process.argv.slice(2);
  const model = option("--model", "sonnet", args);
  const jobs = Number(option("--jobs", "2", args));
  const runner = (option("--runner", "claude", args) as Runner);
  if (runner === "opencode") assertOpencodeModel(model);
  if (runner !== "claude" && runner !== "opencode") throw new Error(`--runner must be claude or opencode, got ${runner}`);
  const outDir = option("--out", "", args);
  const all = args.includes("--all");
  const tail = args.includes("--tail");
  const pilot = args.includes("--pilot");
  const targets = args.filter((a) => !a.startsWith("--"));
  const modelIds = [...new Set([...(pilot ? PILOT : []), ...targets.map((t) => t.split("/")[0])])];
  if (!modelIds.length && !all) throw new Error("usage: report.ts <model_id[/gen_slug]>... | --pilot | --all");
  const wanted = (g: DbGen) => all || pilot || targets.includes(g.model_id) || targets.includes(`${g.model_id}/${g.slug}`);
  const explicit = (g: DbGen) => targets.includes(`${g.model_id}/${g.slug}`);

  const answersDir = outDir || ANSWERS;
  const errorsDir = outDir ? `${outDir}/errors` : ERRORS;
  const promptsDir = outDir ? `${outDir}/prompts` : PROMPTS;

  await mkdir(answersDir, { recursive: true });
  await mkdir(errorsDir, { recursive: true });
  await mkdir(promptsDir, { recursive: true });
  // Newest generations first: they are what most buyers look at. A full run goes by registrations instead, so the
  // generations most people drive are covered before the subscription runs out.
  const queue = (await loadGenerations(all ? [] : modelIds))
    .filter(wanted)
    .filter((g) => explicit(g) || !existsSync(`${answersDir}/${g.id}.json`))
    .sort((a, b) => (all ? (tail ? -1 : 1) * (b.registrations - a.registrations) : b.year_from - a.year_from));
  const total = queue.length;
  let done = 0;
  const failed: string[] = [];

  async function worker() {
    for (let gen = queue.shift(); gen; gen = queue.shift()) {
      // Another runner working the other end of the list may have written it since the queue was built.
      if (!explicit(gen) && existsSync(`${answersDir}/${gen.id}.json`)) {
        done++;
        continue;
      }
      const label = `${gen.model_id}/${gen.slug}`;
      const started = Date.now();
      const prompt = reportPrompt(gen);
      await writeFile(`${promptsDir}/${gen.id}.md`, prompt);
      let why: string | undefined;
      let cost = 0;
      try {
        const res = await ask(prompt, model, ReportAnswer, { runner, tools: TOOLS, system: SYSTEM, cwd: REPORT_DIR, timeoutMs: TIMEOUT_MS });
        cost = res.total_cost_usd ?? 0;
        const parsed = ReportAnswer.safeParse(res.structured_output);
        if (res.is_error || !parsed.success) why = res.is_error ? `CLI error: ${res.result}` : parsed.error!.message;
        else {
          await writeFile(`${answersDir}/${gen.id}.json`, JSON.stringify({ model_id: gen.model_id, slug: gen.slug, name: gen.name, runner, model, cost_usd: cost, seconds: Math.round((Date.now() - started) / 1000), ...parsed.data }, null, 2));
          await rm(`${errorsDir}/${gen.id}.txt`, { force: true });
        }
      } catch (e) {
        why = (e as Error).message;
      }
      done++;
      if (why) {
        failed.push(label);
        await writeFile(`${errorsDir}/${gen.id}.txt`, `${label}\n${why}`);
      }
      const secs = Math.round((Date.now() - started) / 1000);
      console.log(`[${done}/${total}] ${label} ${why ? `FAILED ${why.slice(0, 200)}` : "ok"} (${secs}s, ~$${cost.toFixed(2)} equiv)`);
      // A usage-limit answer means every further call fails too: stop and let the user rerun later.
      if (why && /limit|quota|rate|429|insufficient/i.test(why)) {
        queue.length = 0;
        console.log("Stopping: subscription limit reached. Rerun the same command later to resume.");
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(jobs, total) }, worker));
  console.log(`${done - failed.length} answered, ${failed.length} failed, ${total - done} left${failed.length ? `: ${failed.join(" ")}` : ""}`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
