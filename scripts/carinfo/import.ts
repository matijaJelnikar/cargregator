// Turns checked reports into SQL: unsupported failures and dead or wrong links and sources are dropped (verify.ts has
// already corrected the prose it found wrong). A report whose sources mostly failed is held back (listed in
// import-report.md) unless --force. Imported content gets
// status ai_checked, which is what makes it public. Rerunning replaces a generation's failures, checks and links.
// Each answer records the runner/model that wrote it; import.ts writes that as `generated_by`.
// Each generation is one carinfo.load_report call, small enough to run through the Supabase MCP.
//
// Only reports checked since the last export are written (exported.json remembers each one's check time), as a new
// batch of files named after the run, so earlier batches are never overwritten.
//
//   node scripts/carinfo/import.ts           # new/re-checked reports → data-raw/carinfo/sql/reports-<stamp>-NNN.sql
//   node scripts/carinfo/import.ts --all     # every checked report again (same file naming)
//   node scripts/carinfo/import.ts --force   # also export reports that would be held back
//
// import-report.md starts with the coverage line (written / checked / exported / held back / total generations).

import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { ReportAnswer, VerifyAnswer } from "../../src/lib/carinfo.ts";
import LINK_MAP from "../../src/data/carLinks.json" with { type: "json" };
import { sqlString as q } from "./sql.ts";
import { REPORT_DIR, loadGenerations } from "./report.ts";
import { isDead } from "./verify.ts";

const ANSWERS = `${REPORT_DIR}/answers`;
const CHECKED = `${REPORT_DIR}/checked`;
const SQL_DIR = "data-raw/carinfo/sql";
const EXPORTED = `${REPORT_DIR}/exported.json`;
// About 20 generations per file: still pastes into the Supabase SQL editor in one go.
const MAX_CHUNK = 300_000;

export function generationSql(id: string, a: ReportAnswer, v: VerifyAnswer & { http?: Record<string, number> }, generatedBy: string, modelId = "") {
  // The model pages we already link to for every generation (src/lib/carLinks.ts) are not repeated.
  const known = (LINK_MAP as Record<string, { am?: string; adac?: string }>)[modelId] ?? {};
  const bad = new Set([...v.bad_urls, ...(known.am ? [known.am] : []), ...(known.adac ? [known.adac] : [])]);
  const ok = (url: string) => !bad.has(url) && !isDead(v.http?.[url]);

  const failures = a.failures
    .map((f, i) => ({ f, check: v.failures.find((c) => c.index === i) }))
    .filter(({ check }) => check && check.check !== "unsupported")
    .map(({ f, check }) => ({ ...f, sources: f.sources.filter((s) => ok(s.url)), check: check!.check, note: check!.note }))
    .filter((f) => f.sources.length > 0);
  const links = a.links.filter((l) => ok(l.url));
  const ncap = a.ncap && ok(a.ncap.url) ? a.ncap : null;
  const payload = { summary: a.summary, pros: a.pros, cons: a.cons, confidence: a.confidence, ncap, engines: a.engines, failures, checks: a.checks, links };
  // carinfo.load_report (migration 20261022000400) writes everything for the generation in one call.
  const sql = `select * from carinfo.load_report(${q(id)}::uuid, ${q(JSON.stringify(payload))}::jsonb, ${q(generatedBy)});`;
  return { sql, kept: failures.length, dropped: a.failures.length - failures.length, links: links.length, droppedLinks: a.links.length - links.length };
}

/** More than half of a report's failures unsupported: too weak to publish without --force. */
export const isHeld = (unsupported: number, failures: number) => unsupported * 2 > failures;

/** A report needs exporting when it was never exported or was checked again since. */
export const needsExport = (checkedAt: number, exportedAt: number | undefined) => exportedAt === undefined || checkedAt > exportedAt;

export interface Coverage {
  total: number;
  written: number;
  checked: number;
  exported: number;
  held: number;
  previously: number;
}

export function coverageLine(c: Coverage) {
  return (
    `**Coverage:** ${c.written} of ${c.total} generations written, ${c.checked} checked; this run exported ${c.exported}` +
    ` and held back ${c.held}; ${c.previously} exported in earlier runs and unchanged.`
  );
}

/** 2026-10-24T14:31Z → "20261024-1431", for batch file names that sort by time. */
export const batchStamp = (d: Date) => d.toISOString().slice(0, 16).replace(/[-:]/g, "").replace("T", "-");

async function main() {
  const force = process.argv.includes("--force");
  const all = process.argv.includes("--all");
  await mkdir(SQL_DIR, { recursive: true });
  const exported: Record<string, number> = existsSync(EXPORTED) ? JSON.parse(await readFile(EXPORTED, "utf8")) : {};
  const answerIds = (await readdir(ANSWERS)).filter((f) => !f.endsWith(".orig.json")).map((f) => f.replace(/\.json$/, ""));
  const total = (await loadGenerations([])).length;

  const chunks: string[] = [];
  let chunk = "";
  const rows: string[] = [];
  const c: Coverage = { total, written: answerIds.length, checked: 0, exported: 0, held: 0, previously: 0 };
  for (const id of answerIds) {
    const raw = JSON.parse(await readFile(`${ANSWERS}/${id}.json`, "utf8"));
    const label = `${raw.model_id}/${raw.slug}`;
    if (!existsSync(`${CHECKED}/${id}.json`)) {
      rows.push(`| ${label} | not checked | | | |`);
      continue;
    }
    c.checked++;
    const checkedAt = (await stat(`${CHECKED}/${id}.json`)).mtimeMs;
    if (!all && !needsExport(checkedAt, exported[id])) {
      c.previously++;
      continue;
    }
    const a = ReportAnswer.parse(raw);
    const checked = JSON.parse(await readFile(`${CHECKED}/${id}.json`, "utf8"));
    const v = { ...VerifyAnswer.parse(checked), http: checked.http as Record<string, number> | undefined };
    const unsupported = v.failures.filter((f) => f.check === "unsupported").length;
    if (isHeld(unsupported, a.failures.length) && !force) {
      c.held++;
      rows.push(`| ${label} | HELD | | | ${unsupported}/${a.failures.length} failures unsupported |`);
      continue;
    }
    const runner = (raw.runner as string | undefined) ?? "claude";
    const model = (raw.model as string | undefined) ?? "sonnet";
    const g = generationSql(id, a, v, `${runner}/${model} report`, raw.model_id);
    rows.push(`| ${label} | exported | ${g.kept}/${g.dropped} | ${g.links}/${g.droppedLinks} | ${checked.fixed ? `${v.errors.length} errors fixed` : ""} |`);
    const stmt = `-- ${label}\n${g.sql}\n\n`;
    if (chunk.length + stmt.length > MAX_CHUNK && chunk) {
      chunks.push(chunk);
      chunk = "";
    }
    chunk += stmt;
    exported[id] = checkedAt;
    c.exported++;
  }
  if (chunk) chunks.push(chunk);

  const stamp = batchStamp(new Date());
  const files = chunks.map((_, i) => `${SQL_DIR}/reports-${stamp}-${String(i).padStart(3, "0")}.sql`);
  for (const [i, sql] of chunks.entries()) await writeFile(files[i], sql);
  await writeFile(EXPORTED, JSON.stringify(exported, null, 1) + "\n");
  const table = ["| generation | status | failures kept/dropped | links kept/dropped | notes |", "|---|---|---|---|---|", ...rows];
  const batch = files.length ? `Batch ${stamp}: ${files.map((f) => f.split("/").at(-1)).join(", ")}` : "No new SQL in this run.";
  await writeFile(`${REPORT_DIR}/import-report.md`, `${coverageLine(c)}\n\n${batch}\n\n${table.join("\n")}\n`);
  console.log(`${coverageLine(c).replace(/\*\*/g, "")}\n${batch}\nsee ${REPORT_DIR}/import-report.md`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
