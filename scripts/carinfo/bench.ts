// Benchmark 2–3 OpenCode Go models on the 5 pilot generations against the existing Sonnet answers.
// Writes raw answers to data-raw/carinfo/reports/bench/<model>/, runs the Claude check pass on each, and prints a
// comparison table to data-raw/carinfo/reports/bench.md.
//
//   node scripts/carinfo/bench.ts

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { ReportAnswer, VerifyAnswer } from "../../src/lib/carinfo.ts";

export const REPORT_DIR = "data-raw/carinfo/reports";
const ANSWERS = `${REPORT_DIR}/answers`;
const BENCH_DIR = `${REPORT_DIR}/bench`;
const BENCH_MD = `${REPORT_DIR}/bench.md`;

export const BENCH_GENERATIONS = [
  { id: "1837ba9f-d819-438d-80c8-f77a7833d7c3", model_id: "volkswagen-golf", slug: "mk7", name: "Golf VII" },
  { id: "3419ee8f-f2f2-45af-9b3f-c1e645eb37af", model_id: "skoda-octavia", slug: "mk3", name: "Octavia III" },
  { id: "aa52c6b2-f56f-4134-8ca0-9bbbbaf87501", model_id: "renault-clio", slug: "mk4", name: "Clio IV" },
  { id: "6aa68bc3-161d-4043-a354-fa852c98d878", model_id: "nissan-qashqai", slug: "j11", name: "Qashqai II (J11)" },
  { id: "6d5f7704-9bfb-4bb5-abc1-4c68399e5a40", model_id: "dacia-sandero", slug: "mk3", name: "Sandero III" },
];

// Cheap models only: Go has one shared budget, and one Kimi K3 report costs as much as ~10 DeepSeek ones.
export const BENCH_MODELS = [
  "opencode-go/deepseek-v4-pro",
  "opencode-go/minimax-m3",
  "opencode-go/glm-5.3-flash",
  "opencode-go/kimi-k2.7-code",
];

function modelDir(model: string): string {
  return `${BENCH_DIR}/${model.replace(/\//g, "-")}`;
}

function run(cmd: string, args: string[], cwd: string): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("close", (code) => resolve({ code, stdout, stderr }));
    child.on("error", reject);
  });
}

async function runReports(model: string): Promise<void> {
  const out = modelDir(model);
  await mkdir(out, { recursive: true });
  const targets = BENCH_GENERATIONS.map((g) => `${g.model_id}/${g.slug}`);
  console.log(`\n[bench] generating ${model} → ${out}`);
  const { code, stdout, stderr } = await run(
    "node",
    ["scripts/carinfo/report.ts", "--runner", "opencode", "--model", model, "--out", out, ...targets],
    process.cwd(),
);
  console.log(stdout);
  if (stderr) console.error(stderr);
  if (code !== 0) throw new Error(`report.ts failed for ${model} (exit ${code})`);
}

async function runVerify(model: string): Promise<void> {
  const out = modelDir(model);
  console.log(`\n[bench] verifying ${model} → ${out}/checked`);
  const { code, stdout, stderr } = await run("node", ["scripts/carinfo/verify.ts", "--out", out], process.cwd());
  console.log(stdout);
  if (stderr) console.error(stderr);
  if (code !== 0) throw new Error(`verify.ts failed for ${model} (exit ${code})`);
}

interface BenchRow {
  generation: string;
  model: string;
  failures: number;
  sources: number;
  supported: number;
  weak: number;
  unsupported: number;
  verdictDiffs: number;
  confidence: number;
  timeSeconds: number;
  costUsd: number;
}

function verdict(e: { verdict: string }): string {
  return e.verdict;
}

async function collectRow(gen: typeof BENCH_GENERATIONS[0], model: string): Promise<BenchRow> {
  const out = modelDir(model);
  const answerPath = `${out}/${gen.id}.json`;
  const checkedPath = `${out}/checked/${gen.id}.json`;
  const sonnetPath = `${ANSWERS}/${gen.id}.json`;

  let failures = 0;
  let sources = 0;
  let supported = 0;
  let weak = 0;
  let unsupported = 0;
  let verdictDiffs = 0;
  let confidence = 0;
  let timeSeconds = 0;
  let costUsd = 0;

  if (existsSync(answerPath)) {
    const raw = JSON.parse(await readFile(answerPath, "utf8"));
    const parsed = ReportAnswer.safeParse(raw);
    if (parsed.success) {
      failures = parsed.data.failures.length;
      sources = parsed.data.failures.reduce((n, f) => n + f.sources.length, 0);
      confidence = parsed.data.confidence;
    }
    costUsd = raw.cost_usd ?? 0;
    timeSeconds = raw.seconds ?? 0;
  }

  if (existsSync(checkedPath)) {
    const raw = JSON.parse(await readFile(checkedPath, "utf8"));
    const parsed = VerifyAnswer.safeParse(raw);
    if (parsed.success) {
      for (const f of parsed.data.failures) {
        if (f.check === "supported") supported++;
        else if (f.check === "weak") weak++;
        else if (f.check === "unsupported") unsupported++;
      }
    }
  }

  if (existsSync(answerPath) && existsSync(sonnetPath)) {
    const answer = ReportAnswer.safeParse(JSON.parse(await readFile(answerPath, "utf8")));
    const sonnet = ReportAnswer.safeParse(JSON.parse(await readFile(sonnetPath, "utf8")));
    if (answer.success && sonnet.success) {
      const sv = new Map(sonnet.data.engines.map((e) => [e.name, verdict(e)]));
      for (const e of answer.data.engines) {
        if (sv.get(e.name) !== verdict(e)) verdictDiffs++;
      }
    }
  }

  return {
    generation: `${gen.model_id}/${gen.slug}`,
    model,
    failures,
    sources,
    supported,
    weak,
    unsupported,
    verdictDiffs,
    confidence,
    timeSeconds,
    costUsd,
  };
}

function renderMarkdown(rows: BenchRow[]): string {
  const header = "| generation | model | failures | sources | supported | weak | unsupported | verdict diffs | confidence | time (s) | cost ($) |";
  const separator = "|---|---|---|---|---|---|---|---|---|---|---|";
  const lines = [header, separator];
  for (const r of rows) {
    lines.push(
      `| ${r.generation} | ${r.model} | ${r.failures} | ${r.sources} | ${r.supported} | ${r.weak} | ${r.unsupported} | ${r.verdictDiffs} | ${r.confidence.toFixed(2)} | ${r.timeSeconds} | ${r.costUsd.toFixed(4)} |`,
    );
  }
  return lines.join("\n") + "\n";
}

async function main() {
  await mkdir(BENCH_DIR, { recursive: true });
  const rows: BenchRow[] = [];

  for (const model of BENCH_MODELS) {
    await runReports(model);
    await runVerify(model);
    for (const gen of BENCH_GENERATIONS) {
      rows.push(await collectRow(gen, model));
    }
  }

  const md = `# Report benchmark\n\nGenerated ${new Date().toISOString().slice(0, 10)}.\n\n${renderMarkdown(rows)}`;
  await writeFile(BENCH_MD, md);
  console.log(`\n[bench] wrote ${BENCH_MD}`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
