// Turns checked reports into SQL: unsupported failures and dead or wrong links and sources are dropped (verify.ts has
// already corrected the prose it found wrong). A report whose sources mostly failed is held back (listed in
// import-report.md) unless --force. Imported content gets
// status ai_checked, which is what makes it public. Rerunning replaces a generation's failures, checks and links.
// Each generation is one carinfo.load_report call, small enough to run through the Supabase MCP.
//
//   node scripts/carinfo/import.ts [--force]   # → data-raw/carinfo/sql/reports-NNN.sql + reports/import-report.md

import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { ReportAnswer, VerifyAnswer } from "../../src/lib/carinfo.ts";
import LINK_MAP from "../../src/data/carLinks.json" with { type: "json" };
import { sqlString as q } from "./sql.ts";
import { REPORT_DIR } from "./report.ts";
import { isDead } from "./verify.ts";

const ANSWERS = `${REPORT_DIR}/answers`;
const CHECKED = `${REPORT_DIR}/checked`;
const SQL_DIR = "data-raw/carinfo/sql";
const MAX_CHUNK = 60_000;

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

async function main() {
  const force = process.argv.includes("--force");
  await mkdir(SQL_DIR, { recursive: true });
  const ids = (await readdir(ANSWERS))
    .filter((f) => !f.endsWith(".orig.json"))
    .map((f) => f.replace(/\.json$/, ""))
    .filter((id) => existsSync(`${CHECKED}/${id}.json`));
  const chunks: string[] = [];
  let chunk = "";
  const report: string[] = ["| generation | status | failures kept/dropped | links kept/dropped | notes |", "|---|---|---|---|---|"];
  for (const id of ids) {
    const raw = JSON.parse(await readFile(`${ANSWERS}/${id}.json`, "utf8"));
    const a = ReportAnswer.parse(raw);
    const checked = JSON.parse(await readFile(`${CHECKED}/${id}.json`, "utf8"));
    const v = { ...VerifyAnswer.parse(checked), http: checked.http as Record<string, number> | undefined };
    const label = `${raw.model_id}/${raw.slug}`;
    const unsupported = v.failures.filter((f) => f.check === "unsupported").length;
    if (unsupported * 2 > a.failures.length && !force) {
      report.push(`| ${label} | HELD | | | ${unsupported}/${a.failures.length} failures unsupported |`);
      continue;
    }
    const g = generationSql(id, a, v, `claude-${raw.model ?? "sonnet"} report`, raw.model_id);
    report.push(`| ${label} | imported | ${g.kept}/${g.dropped} | ${g.links}/${g.droppedLinks} | ${checked.fixed ? `${v.errors.length} errors fixed` : ""} |`);
    const stmt = `-- ${label}\n${g.sql}\n\n`;
    if (chunk.length + stmt.length > MAX_CHUNK && chunk) {
      chunks.push(chunk);
      chunk = "";
    }
    chunk += stmt;
  }
  if (chunk) chunks.push(chunk);
  for (const [i, c] of chunks.entries()) await writeFile(`${SQL_DIR}/reports-${String(i).padStart(3, "0")}.sql`, c);
  await writeFile(`${REPORT_DIR}/import-report.md`, report.join("\n") + "\n");
  console.log(`${ids.length} checked reports → ${chunks.length} SQL files in ${SQL_DIR}; see ${REPORT_DIR}/import-report.md`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
