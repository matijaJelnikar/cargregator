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
// An answer whose pros/cons have no short labels is not exported until shorten.ts has written them (unless --force).

import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { ReportAnswer, VerifyAnswer, hasShorts } from "../../src/lib/carinfo.ts";
import LINK_MAP from "../../src/data/carLinks.json" with { type: "json" };
import { sqlString as q } from "./sql.ts";
import { REPORT_DIR, loadGenerations } from "./report.ts";
import { EngineMatchError, matchReportEngines, type EngineIdentity } from "./engine-names.ts";
import { isDead } from "./verify.ts";

const ANSWERS = `${REPORT_DIR}/answers`;
const CHECKED = `${REPORT_DIR}/checked`;
const SQL_DIR = "data-raw/carinfo/sql";
const EXPORTED = `${REPORT_DIR}/exported.json`;
// About 20 generations per file: still pastes into the Supabase SQL editor in one go.
const MAX_CHUNK = 300_000;

/** MiniMax often drops the space before a number ("razvil200 kW", "either120"). Only lowercase words get the space
 * back. Preserve names like Mazda5, Euro6, Hybrid4 and the engine designation evo2. */
export const spaceNumbers = (s: string) => s.replace(/(?<!\p{L})(?!evo2\b)(\p{Ll}{2,})(?=\d)/gu, "$1 ");

/** Applies spaceNumbers to every {sl, en} text in a report; names, engine keys and URLs are left alone. */
export function cleanText<T>(x: T): T {
  if (Array.isArray(x)) return x.map(cleanText) as T;
  if (!x || typeof x !== "object") return x;
  const o = x as Record<string, unknown>;
  if (typeof o.sl === "string" && typeof o.en === "string")
    return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, k === "sl" || k === "en" ? spaceNumbers(v as string) : cleanText(v)])) as T;
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, cleanText(v)])) as T;
}

const CHECK_SCORE = { supported: 1, weak: 0.5, unsupported: 0 } as const;

/** Confidence from the check pass, the same for every runner (models rate themselves very differently: MiniMax
 * 0.7–0.8, Claude 0.4–0.6). 70% how well the checker found the failures supported, 30% how many different sites
 * the published failures cite (4 or more counts as full), minus 0.05 per prose error the checker had to fix. */
export function checkConfidence(v: Pick<VerifyAnswer, "failures" | "errors">, failures: number, sources: string[]) {
  // A failure the checker skipped counts as weak, as in verify.ts.
  let sum = 0;
  for (let i = 0; i < failures; i++) sum += CHECK_SCORE[v.failures.find((f) => f.index === i)?.check ?? "weak"];
  const checkScore = failures ? sum / failures : 0.5;
  const sites = new Set(sources.map((u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } })).size;
  const score = 0.7 * checkScore + 0.3 * Math.min(1, sites / 4) - Math.min(0.2, 0.05 * v.errors.length);
  return Math.round(Math.max(0, Math.min(1, score)) * 100) / 100;
}

export function reportPayload(a: ReportAnswer, v: VerifyAnswer & { http?: Record<string, number> }, modelId = "") {
  // The model pages we already link to for every generation (src/lib/carLinks.ts) are not repeated.
  const known = (LINK_MAP as Record<string, { am?: string; adac?: string }>)[modelId] ?? {};
  const bad = new Set([...v.bad_urls, ...(known.am ? [known.am] : []), ...(known.adac ? [known.adac] : [])]);
  // carinfo.links/ncap_url require https (constraint links_url_https), so a plain-http page would abort the whole load.
  const ok = (url: string) => url.startsWith("https://") && !bad.has(url) && !isDead(v.http?.[url]);

  const failures = a.failures
    .map((f, i) => ({ f, check: v.failures.find((c) => c.index === i) }))
    .filter(({ check }) => check && check.check !== "unsupported")
    .map(({ f, check }) => ({ ...f, sources: f.sources.filter((s) => ok(s.url)), check: check!.check, note: check!.note }))
    .filter((f) => f.sources.length > 0);
  const links = a.links.filter((l) => ok(l.url));
  const ncap = a.ncap && ok(a.ncap.url) ? a.ncap : null;
  const confidence = checkConfidence(v, a.failures.length, failures.flatMap((f) => f.sources.map((s) => s.url)));
  const payload = cleanText({ summary: a.summary, pros: a.pros, cons: a.cons, confidence, ncap, engines: a.engines, failures, checks: a.checks, links });
  return { payload, kept: failures.length, dropped: a.failures.length - failures.length, links: links.length, droppedLinks: a.links.length - links.length };
}

export function generationSql(id: string, a: ReportAnswer, v: VerifyAnswer & { http?: Record<string, number> }, generatedBy: string, modelId = "", catalogue?: EngineIdentity[], scope = "") {
  if (!catalogue) throw new EngineMatchError("Engine catalogue required for a checked import");
  const matched = matchReportEngines(a, catalogue, scope);
  if (matched.issues.length) throw new EngineMatchError(matched.issues.join("; "));
  const result = reportPayload(matched.answer, v, modelId);
  const sql = `select * from carinfo.load_report(${q(id)}::uuid, ${q(JSON.stringify(result.payload))}::jsonb, ${q(generatedBy)});`;
  return { ...result, sql };
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
  unshortened: number;
  previously: number;
  unmatched?: number;
}

export function coverageLine(c: Coverage) {
  return (
    `**Coverage:** ${c.written} of ${c.total} generations written, ${c.checked} checked; this run exported ${c.exported}` +
    ` and held back ${c.held}; ${c.previously} exported in earlier runs and unchanged; ${c.unshortened} need shorten.ts.` +
    (c.unmatched ? ` ${c.unmatched} need engine-name/coverage fixes.` : "")
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
  const generations = await loadGenerations([]);
  const catalogues = new Map(generations.map((g) => [g.id, g.engines]));
  const total = generations.length;

  const chunks: string[] = [];
  let chunk = "";
  const rows: string[] = [];
  const c: Coverage = { total, written: answerIds.length, checked: 0, exported: 0, held: 0, unshortened: 0, previously: 0 };
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
    if (!hasShorts(a) && !force) {
      c.unshortened++;
      rows.push(`| ${label} | NEEDS SHORTEN | | | run shorten.ts |`);
      continue;
    }
    const runner = (raw.runner as string | undefined) ?? "claude";
    const model = (raw.model as string | undefined) ?? "sonnet";
    let g: ReturnType<typeof generationSql>;
    try {
      g = generationSql(id, a, v, `${runner}/${model} report`, raw.model_id, catalogues.get(id), label);
    } catch (error) {
      if (!(error instanceof EngineMatchError)) throw error;
      c.unmatched = (c.unmatched ?? 0) + 1;
      rows.push(`| ${label} | ENGINE MATCH ERROR | | | ${error.message.replaceAll("|", "/")} |`);
      continue;
    }
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
