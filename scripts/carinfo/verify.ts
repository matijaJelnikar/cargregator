// Check pass for written reports: first a plain HTTP check of every cited URL, then a second `claude -p` call
// (WebFetch only) that reads each failure's sources and says whether they support it. Results go next to the
// answers; import.ts drops unsupported failures and dead links. Resumable like report.ts.
//
//   node scripts/carinfo/verify.ts                 # every answer without a check
//   node scripts/carinfo/verify.ts <generationId>  # re-check some

import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { ReportAnswer, ReportFix, VerifyAnswer } from "../../src/lib/carinfo.ts";
import { REPORT_DIR, carName } from "./report.ts";
import { ask, jsonSchema } from "./run-claude.ts";

const ANSWERS = `${REPORT_DIR}/answers`;
const CHECKED = `${REPORT_DIR}/checked`;
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";

const SYSTEM = `You are a strict fact checker for a used-car guide. Open the cited pages with WebFetch and judge
whether they support each claim for this exact car and generation. Answer with JSON matching the given schema only.`;

/** HTTP status per URL (0 = network error). Some sites block bots, so 403/429 count as "unknown", not dead. */
export async function urlStatus(urls: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  await Promise.all(
    [...new Set(urls)].map(async (url) => {
      try {
        const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(20_000) });
        await res.body?.cancel();
        out.set(url, res.status);
      } catch {
        out.set(url, 0);
      }
    }),
  );
  return out;
}

export const isDead = (status: number | undefined) => status === 404 || status === 410 || status === 0;

function verifyPrompt(a: ReportAnswer & { model_id: string }, status: Map<string, number>, genName: string): string {
  const { make } = carName(a.model_id);
  const s = (u: string) => `${u} [HTTP ${status.get(u) ?? "?"}]`;
  return `# Check the report for the ${make} ${genName}

## Failures (check each by index)
${a.failures
  .map(
    (f, i) => `${i}. ${f.title.en}${f.engine ? ` (${f.engine})` : ""}, ${f.year_from ?? "?"}–${f.year_to ?? "?"}, likelihood ${f.likelihood}: ${f.body.en}
   sources: ${f.sources.map((x) => s(x.url)).join(" ; ")}`,
  )
  .join("\n")}

## Links and Euro NCAP
${a.links.map((l) => `- ${l.kind}: ${s(l.url)} (${l.title})`).join("\n")}
- ncap: ${a.ncap ? `${a.ncap.stars} stars ${a.ncap.year} ${s(a.ncap.url)}` : "none"}

## Summary, pros, cons, engines
${a.summary.en}
Pros: ${a.pros.map((p) => p.en).join("; ")}
Cons: ${a.cons.map((p) => p.en).join("; ")}
${a.engines.map((e) => `- ${e.name}: ${e.verdict} ${e.score}/10 — ${e.summary.en}`).join("\n")}

## Your job
- failures: exactly ${a.failures.length} entries, one for every index 0–${a.failures.length - 1}; open its sources. "supported": a source clearly describes this problem for this car
  (or its engine/platform in these years). "weak": related but vague, another generation, or only forum hearsay.
  "unsupported": sources don't mention it or don't load. note: one short sentence why.
- bad_urls: links or the NCAP URL that don't load or are about another car or generation. HTTP 404/410/0 are dead;
  403/429 often mean the site blocks bots, so open those before judging.
- errors: statements in the summary, pros, cons or engine entries that the sources contradict or that you know
  are wrong for this generation (wrong years, wrong engine, wrong claim). Give the claim and the corrected wording.
  Do not list statements only because the cited pages don't mention them: put those in unsourced instead.
- unsourced: plausible statements the cited pages don't cover (short list, informational).
`;
}

async function main() {
  const only = process.argv.slice(2);
  await mkdir(CHECKED, { recursive: true });
  const ids = (await readdir(ANSWERS))
    .filter((f) => !f.endsWith(".orig.json"))
    .map((f) => f.replace(/\.json$/, ""))
    .filter((id) => (only.length ? only.includes(id) : !existsSync(`${CHECKED}/${id}.json`)));
  const schema = jsonSchema(VerifyAnswer);
  for (const [n, id] of ids.entries()) {
    const raw = JSON.parse(await readFile(`${ANSWERS}/${id}.json`, "utf8"));
    const a = { ...ReportAnswer.parse(raw), model_id: raw.model_id as string };
    const urls = [...a.failures.flatMap((f) => f.sources.map((s) => s.url)), ...a.links.map((l) => l.url), ...(a.ncap ? [a.ncap.url] : [])];
    const status = await urlStatus(urls);
    const started = Date.now();
    try {
      let checked: VerifyAnswer | undefined;
      // A check that skips some failures is retried once; failures still missing count as weak.
      for (let attempt = 0; attempt < 2 && (!checked || checked.failures.length < a.failures.length); attempt++) {
        const res = await ask(verifyPrompt(a, status, raw.name ?? raw.slug), "sonnet", schema, { tools: ["WebFetch"], system: SYSTEM, cwd: REPORT_DIR, timeoutMs: 30 * 60_000 });
        const parsed = VerifyAnswer.safeParse(res.structured_output);
        if (res.is_error || !parsed.success) throw new Error(res.is_error ? `CLI error: ${res.result}` : parsed.error!.message);
        checked = parsed.data;
      }
      const v = checked!;
      for (let i = 0; i < a.failures.length; i++)
        if (!v.failures.some((f) => f.index === i)) v.failures.push({ index: i, check: "weak", note: "not checked" });
      if (v.errors.length) await fix(id, raw, a, v);
      await writeFile(`${CHECKED}/${id}.json`, JSON.stringify({ ...v, fixed: v.errors.length > 0, http: Object.fromEntries(status) }, null, 2));
      const c = v.failures.reduce<Record<string, number>>((m, f) => ((m[f.check] = (m[f.check] ?? 0) + 1), m), {});
      console.log(`[${n + 1}/${ids.length}] ${raw.model_id}/${raw.slug} ok ${JSON.stringify(c)}, ${v.bad_urls.length} bad urls, ${v.errors.length} errors fixed (${Math.round((Date.now() - started) / 1000)}s)`);
    } catch (e) {
      console.log(`[${n + 1}/${ids.length}] ${raw.model_id}/${raw.slug} FAILED ${(e as Error).message.slice(0, 300)}`);
      if (/limit|quota|rate/i.test((e as Error).message)) break;
    }
  }
}

/** Rewrites the prose the checker flagged (no tools), keeping the original answer as <id>.orig.json. */
async function fix(id: string, raw: Record<string, unknown>, a: ReportAnswer, v: VerifyAnswer) {
  const prompt = `Correct this used-car report for the ${raw.name ?? raw.slug}. Apply every correction below, keep
everything else as it is (same engines, same names, both languages), and do not add new claims.

## Corrections
${v.errors.map((e) => `- "${e.claim}" → ${e.fix}`).join("\n")}

## Report
${JSON.stringify({ summary: a.summary, pros: a.pros, cons: a.cons, engines: a.engines }, null, 1)}
`;
  const res = await ask(prompt, "sonnet", jsonSchema(ReportFix), { system: "You edit car reports. Answer with JSON matching the given schema only.", cwd: REPORT_DIR });
  const parsed = ReportFix.safeParse(res.structured_output);
  if (res.is_error || !parsed.success) throw new Error(`fix: ${res.is_error ? res.result : parsed.error!.message}`);
  const names = new Set(a.engines.map((e) => e.name));
  if (parsed.data.engines.some((e) => !names.has(e.name))) throw new Error("fix: engine names changed");
  if (!existsSync(`${ANSWERS}/${id}.orig.json`)) await writeFile(`${ANSWERS}/${id}.orig.json`, JSON.stringify(raw, null, 2));
  await writeFile(`${ANSWERS}/${id}.json`, JSON.stringify({ ...raw, ...parsed.data }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
