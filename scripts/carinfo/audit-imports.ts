// Read-only audit and guarded repair SQL. No database writes.
// node scripts/carinfo/audit-imports.ts [--refresh]
// Uses a public-data snapshot; --refresh downloads a fresh one. Apply generated SQL separately.
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { ReportAnswer, VerifyAnswer } from "../../src/lib/carinfo.ts";
import { matchReportEngines, resolveEngineName, type EngineIdentity } from "./engine-names.ts";
import { batchStamp, reportPayload } from "./import.ts";
import { sqlString as q } from "./sql.ts";

interface EngineRow extends EngineIdentity {
  id: string; verdict: string | null; score: number | null; summary_sl: string | null; summary_en: string | null;
  annual_cost_min: number | null; annual_cost_max: number | null; status: string;
}
interface FailureRow {
  id: string; engine_id: string | null; title_sl: string; title_en: string; body_sl: string | null; body_en: string | null;
  sources: { url: string; title: string }[]; status: string; ai_check: string;
}
interface GenerationRow {
  id: string; model_id: string; slug: string; status: string; summary_sl: string | null; summary_en: string | null;
  engines: EngineRow[]; failures: FailureRow[];
}
const DIR = "data-raw/carinfo/engine-audit";
const fields = ["verdict", "score", "annual_cost_min", "annual_cost_max", "summary_sl", "summary_en"] as const;
const bare = (value: unknown) => value == null ? "null" : typeof value === "number" ? String(value) : q(String(value));

const digest = (s: string | null) => s === null ? null : createHash("md5").update(s).digest("hex");
const generationGuard = (g: GenerationRow) => `g.status = 'ai_checked'
    and md5(g.summary_sl) is not distinct from ${q(digest(g.summary_sl))}
    and md5(g.summary_en) is not distinct from ${q(digest(g.summary_en))}`;

export function engineRepairSql(g: GenerationRow, row: EngineRow, assessment: ReportAnswer["engines"][number]) {
  const values = { verdict: assessment.verdict, score: assessment.score, annual_cost_min: assessment.annual_cost_min,
    annual_cost_max: assessment.annual_cost_max, summary_sl: assessment.summary.sl, summary_en: assessment.summary.en };
  return `update carinfo.engines e set ${fields.map((f) => `${f} = ${bare(values[f])}${f === "verdict" ? "::carinfo.verdict" : ""}`).join(", ")},
  status = 'ai_checked', generated_by = 'checked report import repair'
where e.id = ${q(row.id)}::uuid and e.generation_id = ${q(g.id)}::uuid and e.name = ${q(row.name)}
  and e.engine_code is not distinct from ${q(row.engine_code)}
  and e.status = ${q(row.status)}::carinfo.status
  and ${fields.map((f) => `e.${f} is null`).join(" and ")}
  and exists (select 1 from carinfo.generations g where g.id = e.generation_id and ${generationGuard(g)});\n`;
}

export function failureRepairSql(g: GenerationRow, row: FailureRow, engine: EngineRow) {
  return `update carinfo.failures f set engine_id = ${q(engine.id)}::uuid
where f.id = ${q(row.id)}::uuid and f.generation_id = ${q(g.id)}::uuid and f.engine_id is null and f.status = 'ai_checked'
  and f.title_sl = ${q(row.title_sl)} and f.title_en = ${q(row.title_en)}
  and f.body_sl is not distinct from ${q(row.body_sl)} and f.body_en is not distinct from ${q(row.body_en)}
  and f.ai_check = ${q(row.ai_check)}::carinfo.ai_check and f.sources = ${q(JSON.stringify(row.sources))}::jsonb
  and exists (select 1 from carinfo.engines e where e.id = ${q(engine.id)}::uuid and e.generation_id = f.generation_id
    and e.name = ${q(engine.name)} and e.status not in ('reviewed', 'hidden'))
  and exists (select 1 from carinfo.generations g where g.id = f.generation_id and ${generationGuard(g)});\n`;
}

async function main() {
  await mkdir(DIR, { recursive: true });
  const snapshotFile = DIR + "/snapshot.json";
  if (process.argv.includes("--refresh")) {
    const source = await readFile("src/lib/carinfoDb.ts", "utf8");
    const rest = source.match(/export const REST = "([^"]+)"/)![1];
    const key = source.match(/export const PUBLISHABLE_KEY = "([^"]+)"/)![1];
    const select = "id,model_id,slug,status,summary_sl,summary_en,engines(id,name,engine_code,verdict,score,status,summary_sl,summary_en,annual_cost_min,annual_cost_max,generated_by),failures(id,engine_id,title_sl,title_en,body_sl,body_en,sources,status,ai_check)";
    const rows: GenerationRow[] = [];
    for (let offset = 0; ; offset += 500) {
      const res = await fetch(rest + "/generations?select=" + select + "&order=id", {
        headers: { apikey: key, Authorization: "Bearer " + key, "Accept-Profile": "carinfo", Range: `${offset}-${offset + 499}` },
        signal: AbortSignal.timeout(180_000),
      });
      if (!res.ok) throw new Error("snapshot: " + res.status);
      const batch = await res.json() as GenerationRow[];
      rows.push(...batch);
      if (batch.length < 500) break;
    }
    await writeFile(snapshotFile, JSON.stringify(rows, null, 2));
  }
  const snapshot: GenerationRow[] = JSON.parse(await readFile(snapshotFile, "utf8"));
  const exported = JSON.parse(await readFile("data-raw/carinfo/reports/exported.json", "utf8")) as Record<string, number>;
  const statements: string[] = [];
  const details: { generation: string; issues: string[]; engineRows: number; failureLinks: number }[] = [];
  let engineRows = 0, failureLinks = 0, unmatchedAssessments = 0;
  const skipped: string[] = [];
  for (const g of snapshot) {
    if (!(g.id in exported)) continue;
    const scope = g.model_id + "/" + g.slug;
    const raw = JSON.parse(await readFile(`data-raw/carinfo/reports/answers/${g.id}.json`, "utf8"));
    const original = ReportAnswer.parse(raw);
    const checked = JSON.parse(await readFile(`data-raw/carinfo/reports/checked/${g.id}.json`, "utf8"));
    const v = { ...VerifyAnswer.parse(checked), http: checked.http as Record<string, number> | undefined };
    const matched = matchReportEngines(original, g.engines, scope);
    unmatchedAssessments += original.engines.filter((e) => !g.engines.some((x) => x.name === e.name)).length;
    const { payload } = reportPayload(matched.answer, v, g.model_id);
    if (g.status !== "ai_checked" || g.summary_sl !== payload.summary.sl || g.summary_en !== payload.summary.en) {
      skipped.push(scope + ": generation is reviewed or its text differs from the checked answer");
      continue;
    }
    const sql: string[] = [];
    let nEngines = 0, nFailures = 0;
    for (const row of g.engines) {
      if (!["skeleton", "ai_checked"].includes(row.status) || fields.some((f) => row[f] != null)) continue;
      const assessments = payload.engines.filter((e) => resolveEngineName(e.name, g.engines, scope) === row.name);
      if (assessments.length !== 1) continue;
      sql.push(engineRepairSql(g, row, assessments[0])); nEngines++;
    }
    for (const row of g.failures) {
      if (row.engine_id || row.status !== "ai_checked") continue;
      const candidates = payload.failures.filter((f) => f.engine !== null
        && f.title.sl === row.title_sl && f.title.en === row.title_en
        && f.body.sl === row.body_sl && f.body.en === row.body_en
        && f.check === row.ai_check && isDeepStrictEqual(f.sources, row.sources));
      if (candidates.length !== 1) continue;
      const name = resolveEngineName(candidates[0].engine!, g.engines, scope);
      const engine = g.engines.filter((e) => e.name === name && !["reviewed", "hidden"].includes(e.status)).sort((a, b) => a.id.localeCompare(b.id))[0];
      if (!engine) continue;
      sql.push(failureRepairSql(g, row, engine)); nFailures++;
    }
    if (sql.length) statements.push("-- " + scope + "\n" + sql.join("\n"));
    if (sql.length || matched.issues.length) details.push({ generation: scope, issues: matched.issues, engineRows: nEngines, failureLinks: nFailures });
    engineRows += nEngines; failureLinks += nFailures;
  }
  const stamp = batchStamp(new Date());
  const files: string[] = [];
  let chunk = "";
  const chunks: string[] = [];
  for (const stmt of statements) {
    if (chunk.length + stmt.length > 300_000 && chunk) { chunks.push(chunk); chunk = ""; }
    chunk += stmt + "\n";
  }
  if (chunk) chunks.push(chunk);
  for (const [i, sql] of chunks.entries()) {
    const file = `data-raw/carinfo/sql/engine-repair-${stamp}-${String(i).padStart(3, "0")}.sql`;
    await writeFile(file, "-- Local guarded repair; no report reloads or deletions.\nbegin;\n" + sql + "\ncommit;\n");
    files.push(file);
  }
  const result = { generationsAudited: snapshot.filter((g) => g.id in exported).length, unmatchedAssessments, affectedGenerations: details.filter((d) => d.engineRows || d.failureLinks).length,
    engineRows, failureLinks, issues: details.filter((d) => d.issues.length), skipped, files };
  await writeFile(DIR + "/audit.json", JSON.stringify(result, null, 2));
  await writeFile(DIR + "/report.md", "# Engine import audit\n\n" + JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result, null, 2));
}
if (import.meta.url === `file://${process.argv[1]}`) await main();