// Read-only source audit. Produces a report and guarded SQL for Matija to review; never executes SQL.
// node scripts/carinfo/check-links.ts [--snapshot <file>] [--max-urls 100] [--concurrency 4] [--timeout 20000]
// Without --snapshot, reads published failures from the public PostgREST endpoint. GET requests only;
// a source is dead only after two 404/410 responses. Bot blocks, network errors and 5xx are unknown.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { sqlString as q } from "./sql.ts";

export interface SourceFailure {
  id: string;
  generation_id: string;
  status: string;
  title_sl: string;
  title_en: string;
  body_sl: string | null;
  body_en: string | null;
  updated_at: string;
  sources: { url: string; title: string }[];
  generations: { status: string };
}
export interface LinkResult {
  url: string;
  state: "live" | "dead" | "unknown";
  statuses: number[];
  checked_at: string;
  error?: string;
}

const Status = z.enum(["skeleton", "generated", "ai_checked", "reviewed", "hidden"]);
export const SourceFailures = z.array(z.object({
  id: z.uuid(), generation_id: z.uuid(), status: Status,
  title_sl: z.string(), title_en: z.string(), body_sl: z.string().nullable(), body_en: z.string().nullable(),
  updated_at: z.iso.datetime({ offset: true }),
  sources: z.array(z.object({ url: z.string(), title: z.string() })),
  generations: z.object({ status: Status }),
}));

/** Fragments are never sent to the server. Invalid/non-web URLs stay unknown. */
export function sourceUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    url.hash = "";
    return url.href;
  } catch { return null; }
}

const gone = (status: number) => status === 404 || status === 410;
export async function checkLink(url: string, timeoutMs = 20_000, fetcher: typeof fetch = fetch): Promise<LinkResult> {
  const result: LinkResult = { url, state: "unknown", statuses: [], checked_at: new Date().toISOString() };
  if (!sourceUrl(url)) { result.error = "Invalid or unsupported URL"; return result; }
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetcher(url, {
        method: "GET", redirect: "follow", signal: AbortSignal.timeout(timeoutMs),
        headers: { "User-Agent": "Cargregator source-link audit", "Cache-Control": "no-cache" },
      });
      result.statuses.push(res.status);
      await res.body?.cancel();
      // Accepted/empty responses do not establish that the source page is available.
      if (res.ok && ![202, 204, 205].includes(res.status)) { result.state = "live"; return result; }
      if (!gone(res.status)) return result;
    }
    result.state = "dead";
  } catch (error) { result.error = error instanceof Error ? error.message : String(error); }
  return result;
}

export function sourceState(failure: SourceFailure, results: ReadonlyMap<string, LinkResult>): "live" | "dead" | "unknown" {
  if (!failure.sources.length) return "unknown";
  const states = failure.sources.map(({ url }) => results.get(sourceUrl(url) ?? url)?.state ?? "unknown");
  if (states.includes("live")) return "live";
  return states.every((state) => state === "dead") ? "dead" : "unknown";
}

/** Preserve reviewed content, including children of a reviewed generation, and any intervening failure edits. */
export function hideFailureSql(failure: SourceFailure, results: ReadonlyMap<string, LinkResult>): string | null {
  if (failure.status !== "ai_checked" || failure.generations.status !== "ai_checked" || sourceState(failure, results) !== "dead") return null;
  return `update carinfo.failures f set status = 'hidden'
where f.id = ${q(failure.id)}::uuid and f.generation_id = ${q(failure.generation_id)}::uuid
  and f.status = 'ai_checked'
  and f.updated_at = ${q(failure.updated_at)}::timestamptz
  and f.title_sl = ${q(failure.title_sl)} and f.title_en = ${q(failure.title_en)}
  and f.body_sl is not distinct from ${q(failure.body_sl)} and f.body_en is not distinct from ${q(failure.body_en)}
  and f.sources = ${q(JSON.stringify(failure.sources))}::jsonb
  and exists (select 1 from carinfo.generations g where g.id = f.generation_id and g.status = 'ai_checked');\n`;
}

export async function auditLinks(urls: string[], concurrency: number, checker: (url: string) => Promise<LinkResult>): Promise<LinkResult[]> {
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new Error("concurrency must be a positive integer");
  let next = 0;
  const results: LinkResult[] = new Array(urls.length);
  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, async () => {
    while (next < urls.length) {
      const index = next++;
      results[index] = await checker(urls[index]);
    }
  }));
  return results;
}

async function loadFailures(): Promise<SourceFailure[]> {
  // Importing the app module directly would pull Next's path aliases into the standalone Node script.
  const source = await readFile("src/lib/carinfoDb.ts", "utf8");
  const rest = source.match(/export const REST = "([^"]+)"/)?.[1];
  const key = source.match(/export const PUBLISHABLE_KEY = "([^"]+)"/)?.[1];
  if (!rest || !key) throw new Error("Public PostgREST configuration not found");
  const rows: SourceFailure[] = [];
  for (let offset = 0; ; offset += 500) {
    const query = new URLSearchParams({
      select: "id,generation_id,status,title_sl,title_en,body_sl,body_en,updated_at,sources,generations!inner(status)",
      status: "in.(ai_checked,reviewed)", "generations.status": "in.(ai_checked,reviewed)", order: "id",
    });
    const response = await fetch(`${rest}/failures?${query}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Accept-Profile": "carinfo", Range: `${offset}-${offset + 499}` },
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) throw new Error(`Public failure snapshot: ${response.status}`);
    const batch = SourceFailures.parse(await response.json());
    rows.push(...batch);
    if (batch.length < 500) return rows;
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log("usage: node scripts/carinfo/check-links.ts [--snapshot <file>] [--max-urls <n>] [--concurrency 4] [--timeout 20000]\nWrites local audit JSON/Markdown and guarded SQL only. Never writes to Supabase.");
    return;
  }
  const options = new Map<string, string>();
  for (let i = 0; i < args.length; i += 2) {
    if (!["--snapshot", "--max-urls", "--concurrency", "--timeout"].includes(args[i]) || !args[i + 1] || args[i + 1].startsWith("--")) throw new Error(`Invalid option: ${args[i]}`);
    options.set(args[i], args[i + 1]);
  }
  const positive = (name: string, fallback: number) => {
    const value = options.has(name) ? Number(options.get(name)) : fallback;
    if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${name} must be a positive integer`);
    return value;
  };
  const concurrency = positive("--concurrency", 4);
  const timeout = positive("--timeout", 20_000);
  const maxUrls = positive("--max-urls", Number.MAX_SAFE_INTEGER);
  const snapshot = options.get("--snapshot");
  const failures = snapshot ? SourceFailures.parse(JSON.parse(await readFile(snapshot, "utf8"))) : await loadFailures();
  const urls = [...new Set(failures.flatMap((f) => f.sources.map(({ url }) => sourceUrl(url) ?? url)))];
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const out = `data-raw/carinfo/link-audit/${stamp}`;
  await mkdir(out, { recursive: true });
  await writeFile(`${out}/snapshot.json`, JSON.stringify(failures, null, 2));
  console.log(`${failures.length} failures, ${urls.length} unique URLs; checking ${Math.min(urls.length, maxUrls)}`);
  let done = 0;
  const checked = await auditLinks(urls.slice(0, maxUrls), concurrency, async (url) => {
    const result = await checkLink(url, timeout);
    if (++done % 25 === 0) console.log(`Checked ${done}/${Math.min(urls.length, maxUrls)}`);
    return result;
  });
  const byUrl = new Map(checked.map((r) => [r.url, r]));
  const dead = failures.filter((f) => sourceState(f, byUrl) === "dead");
  const sql = dead.flatMap((f) => hideFailureSql(f, byUrl) ?? []);
  const report = {
    checked_at: new Date().toISOString(), failures: failures.length, unique_urls: urls.length,
    checked_urls: checked.length, partial: checked.length !== urls.length,
    live: checked.filter((r) => r.state === "live").length, dead: checked.filter((r) => r.state === "dead").length,
    unknown: checked.filter((r) => r.state === "unknown").length,
    failures_without_live_sources: dead.map((f) => ({ id: f.id, title: f.title_en, generation_id: f.generation_id, reviewed: f.status === "reviewed" || f.generations.status === "reviewed" })),
    sql_candidates: sql.length, results: checked,
  };
  await writeFile(`${out}/results.json`, JSON.stringify(report, null, 2));
  await mkdir("data-raw/carinfo/sql", { recursive: true });
  const sqlFile = `data-raw/carinfo/sql/dead-sources-${stamp}.sql`;
  if (sql.length) await writeFile(sqlFile, `-- Source audit ${report.checked_at}. Review the audit, recheck sources, and obtain Matija's OK before execution.\n-- Two GET responses of 404/410 per source; reviewed content is excluded. No SQL was executed.\nbegin;\n${sql.join("\n")}commit;\n`);
  await writeFile(`${out}/report.md`, `# Source-link audit\n\n${report.checked_at}\n\nChecked ${checked.length}/${urls.length} URLs for ${failures.length} failures${report.partial ? " (partial audit)" : ""}.\nLive: ${report.live}; confirmed dead: ${report.dead}; unknown: ${report.unknown}.\n\n${dead.length} failures have only confirmed-dead sources; ${sql.length} unreviewed failures have guarded SQL candidates. Reviewed content is left for manual review.\n${sql.length ? `SQL: ${sqlFile}` : "No SQL candidates."}\n\nNo database writes were performed. Timeouts, bot blocks, rate limits and server errors remain unknown.\n\n${dead.map((f) => `- ${f.id}: ${f.title_en.replace(/[\r\n]/g, " ")}${f.status === "reviewed" || f.generations.status === "reviewed" ? " (reviewed; no SQL)" : ""}`).join("\n")}\n`);
  console.log(`Audit: ${out}/report.md; ${sql.length} SQL candidates${sql.length ? ` in ${sqlFile}` : ""}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
