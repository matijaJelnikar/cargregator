// Writes the short chip labels for report pros and cons, from the final (verified) sentences. No web tools. Labels
// are written next to the answers (or copied to --out), so a rerun resumes; for reports already exported it also
// writes a guarded backfill that only updates rows whose sentences still match.
//
//   node scripts/carinfo/shorten.ts                         # answers with any item missing short
//   node scripts/carinfo/shorten.ts --all                   # every answer again
//   node scripts/carinfo/shorten.ts <id> <id> ...           # only these
//     --runner claude|opencode  (default claude)  --model <m>  (default "sonnet", chosen in a bake-off)
//     --batch 20                # reports per call
//     --out <dir>               # write labelled copies to <dir>/<id>.json instead of answers/, and no SQL
//   node scripts/carinfo/shorten.ts --sql                   # no LLM: backfill SQL for every exported, labelled answer
//                                                           # (after a run that crashed before writing its SQL)
//
//   node scripts/carinfo/shorten.ts --help                  # this usage

import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { z } from "zod";
import { hasShorts, ReportAnswer, ShortText } from "../../src/lib/carinfo.ts";
import { ask, assertOpencodeModel, isUsageLimitError, type Runner } from "./llm.ts";
import { REPORT_DIR } from "./report.ts";
import { batchStamp, cleanText } from "./import.ts";
import { sqlString } from "./sql.ts";

const ANSWERS = `${REPORT_DIR}/answers`;
const EXPORTED = `${REPORT_DIR}/exported.json`;
const SQL_DIR = "data-raw/carinfo/sql";
// About 20 backfill statements per file, matching import.ts.
const MAX_CHUNK = 300_000;

const SYSTEM = "You write short labels for car pros and cons. Answer with JSON matching the given schema only.";

const USAGE = `usage:
  node scripts/carinfo/shorten.ts                         # answers with any item missing short
  node scripts/carinfo/shorten.ts --all                   # every answer again
  node scripts/carinfo/shorten.ts <id> <id> ...           # only these
    --runner claude|opencode  (default claude)  --model <m>  (default "sonnet")
    --batch 20                # reports per call
    --out <dir>               # write labelled copies to <dir>/<id>.json instead of answers/, and no SQL
  node scripts/carinfo/shorten.ts --sql                   # no LLM: backfill SQL for every exported, labelled answer`;

type ShortLabel = z.infer<typeof ShortText>;

/** The model's answer: one label list per report, in the same order and count as its pros and cons. */
export const ShortenBatch = z.object({
  reports: z.array(
    z.object({
      id: z.string(),
      pros: z.array(ShortText),
      cons: z.array(ShortText),
    }),
  ),
});

/** One report as the short-label prompt sees it: the final sentences, without any old labels. */
export interface ShortenItem {
  id: string;
  name: string;
  pros: { sl: string; en: string }[];
  cons: { sl: string; en: string }[];
}

/** The prompt for one batch of reports; the answer is ShortenBatch. */
export function shortenPrompt(items: ShortenItem[]): string {
  const reports = items.map((r) => ({
    id: r.id,
    name: r.name,
    pros: r.pros.map(({ sl, en }) => ({ sl, en })),
    cons: r.cons.map(({ sl, en }) => ({ sl, en })),
  }));
  return `# Short labels for car pros and cons

For each report below write one short label for every pro and every con, based on its final sentence.

## Rules
- One label per item, same order and count as the input, for both pros and cons.
- 2–4 words, at most 32 characters, in each language. A noun phrase, no full stop.
- The specific point, not a category: "N16 timing chain", not "Engine issues"; "Sliding rear bench", not "Practical".
- Keep model/engine/part codes exactly as written (N16, ALL4, DSG, 1.4 TSI).
- Write the Slovenian label natively, as a Slovenian car journalist would, not a word-for-word translation of the
  English one. Use correct Slovenian grammar and diacritics.
- The label must read unambiguously on its own. Avoid words with a second meaning that changes the point: "easy
  parts supply" is "Dobra dobava delov", never "Lahki deli" (that means lightweight parts).
- Say only what the sentence says; add nothing.

## Reports
${JSON.stringify(reports, null, 1)}
`;
}

export interface ShortLabels {
  pros: ShortLabel[];
  cons: ShortLabel[];
}

/** Returns the answer with short labels set on every pro and con; throws when a list count differs. */
export function applyShorts<T extends Pick<ReportAnswer, "pros" | "cons">>(answer: T, labels: ShortLabels): T {
  if (labels.pros.length !== answer.pros.length)
    throw new Error(`pros: got ${labels.pros.length} labels for ${answer.pros.length} items`);
  if (labels.cons.length !== answer.cons.length)
    throw new Error(`cons: got ${labels.cons.length} labels for ${answer.cons.length} items`);
  return {
    ...answer,
    pros: answer.pros.map((p, i) => ({ ...p, short: labels.pros[i] })),
    cons: answer.cons.map((c, i) => ({ ...c, short: labels.cons[i] })),
  };
}

/** True when at least one pro or con still lacks a valid short label. */
export function needsShorten(answer: Pick<ReportAnswer, "pros" | "cons">): boolean {
  return !hasShorts(answer);
}

/** Backfill for a report already exported: writes the cleaned pros/cons with labels, but only if the stored sentences
 * still match the answer (a newer load or an admin edit wins). */
export function shortsSql(id: string, answer: Pick<ReportAnswer, "pros" | "cons">): string {
  const bare = (items: { sl: string; en: string }[]) => items.map(({ sl, en }) => ({ sl, en }));
  const pros = cleanText(answer.pros);
  const cons = cleanText(answer.cons);
  const pros0 = cleanText(bare(answer.pros));
  const cons0 = cleanText(bare(answer.cons));
  return `update carinfo.generations set pros = ${sqlString(JSON.stringify(pros))}::jsonb, cons = ${sqlString(JSON.stringify(cons))}::jsonb
where id = ${sqlString(id)}::uuid
  and (select coalesce(jsonb_agg(x - 'short'), '[]'::jsonb) from jsonb_array_elements(pros) x) = ${sqlString(JSON.stringify(pros0))}::jsonb
  and (select coalesce(jsonb_agg(x - 'short'), '[]'::jsonb) from jsonb_array_elements(cons) x) = ${sqlString(JSON.stringify(cons0))}::jsonb;`;
}

class StopRun extends Error {}

function option(name: string, fallback: string, args: string[]): string {
  const i = args.indexOf(name);
  if (i === -1) return fallback;
  const [, value] = args.splice(i, 2);
  return value;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log(USAGE);
    return;
  }
  const model = option("--model", "sonnet", args);
  const runner = option("--runner", "claude", args) as Runner;
  if (runner === "opencode") assertOpencodeModel(model);
  if (runner !== "claude" && runner !== "opencode") throw new Error(`--runner must be claude or opencode, got ${runner}`);
  const batchSize = Number(option("--batch", "20", args));
  if (!Number.isInteger(batchSize) || batchSize < 1) throw new Error(`--batch must be a positive integer, got ${batchSize}`);
  const outDir = option("--out", "", args);
  const all = args.includes("--all");
  const only = args.filter((a) => !a.startsWith("--"));

  const answerIds = (await readdir(ANSWERS)).filter((f) => !f.endsWith(".orig.json")).map((f) => f.replace(/\.json$/, ""));
  let ids: string[];
  if (only.length) {
    ids = only;
  } else if (all) {
    ids = answerIds;
  } else {
    ids = [];
    for (const id of answerIds) {
      const raw = JSON.parse(await readFile(`${ANSWERS}/${id}.json`, "utf8"));
      if (needsShorten(ReportAnswer.parse(raw))) ids.push(id);
    }
  }

  const exported: Record<string, number> = !outDir && existsSync(EXPORTED) ? JSON.parse(await readFile(EXPORTED, "utf8")) : {};
  if (outDir) await mkdir(outDir, { recursive: true });
  const statements: string[] = [];

  if (args.includes("--sql")) {
    ids = [];
    for (const id of answerIds) {
      if (!(id in exported)) continue;
      const raw = JSON.parse(await readFile(`${ANSWERS}/${id}.json`, "utf8"));
      const a = ReportAnswer.parse(raw);
      if (hasShorts(a)) statements.push(`-- ${raw.model_id}/${raw.slug}\n${shortsSql(id, a)}\n\n`);
    }
  }

  const total = ids.length;
  let done = 0;
  const failed: string[] = [];

  const runBatch = async (batch: string[]): Promise<void> => {
    const started = Date.now();
    let labels: Map<string, ShortLabels> | undefined;
    let lastError: Error | undefined;
    for (let attempt = 0; attempt < 2 && !labels; attempt++) {
      try {
        const items: ShortenItem[] = [];
        for (const id of batch) {
          const raw = JSON.parse(await readFile(`${ANSWERS}/${id}.json`, "utf8"));
          const a = ReportAnswer.parse(raw);
          items.push({
            id,
            name: String(raw.name ?? raw.slug ?? id),
            pros: a.pros.map(({ sl, en }) => ({ sl, en })),
            cons: a.cons.map(({ sl, en }) => ({ sl, en })),
          });
        }
        const res = await ask(shortenPrompt(items), model, ShortenBatch, {
          runner,
          system: SYSTEM,
          cwd: REPORT_DIR,
          timeoutMs: 10 * 60_000,
        });
        if (res.is_error) throw new Error(`CLI error: ${res.result}`);
        const parsed = ShortenBatch.safeParse(res.structured_output);
        if (!parsed.success) throw new Error(parsed.error.message);
        const got = new Map(parsed.data.reports.map((r) => [r.id, r]));
        const missing = batch.filter((id) => !got.has(id));
        if (missing.length) throw new Error(`missing reports: ${missing.join(", ")}`);
        for (const item of items) {
          const r = got.get(item.id)!;
          if (r.pros.length !== item.pros.length || r.cons.length !== item.cons.length)
            throw new Error(`${item.id}: expected ${item.pros.length} pros and ${item.cons.length} cons, got ${r.pros.length}/${r.cons.length}`);
        }
        labels = new Map(batch.map((id) => [id, { pros: got.get(id)!.pros, cons: got.get(id)!.cons }]));
      } catch (e) {
        lastError = e as Error;
        // A subscription limit stops every further call, so stop the whole run.
        if (isUsageLimitError(lastError.message)) throw new StopRun(lastError.message);
      }
    }

    if (!labels) {
      if (batch.length > 1) {
        const mid = Math.ceil(batch.length / 2);
        await runBatch(batch.slice(0, mid));
        await runBatch(batch.slice(mid));
        return;
      }
      done++;
      failed.push(batch[0]);
      console.log(`[${done}/${total}] FAILED ${batch[0]} ${(lastError?.message ?? "unknown error").slice(0, 300)}`);
      return;
    }

    for (const id of batch) {
      const raw = JSON.parse(await readFile(`${ANSWERS}/${id}.json`, "utf8"));
      const labelled = applyShorts(ReportAnswer.parse(raw), labels.get(id)!);
      await writeFile(`${outDir || ANSWERS}/${id}.json`, JSON.stringify({ ...raw, ...labelled }, null, 2));
      if (!outDir && id in exported) statements.push(`-- ${raw.model_id}/${raw.slug}\n${shortsSql(id, labelled)}\n\n`);
    }
    done += batch.length;
    console.log(`[${done}/${total}] ok ${batch.length} reports (${Math.round((Date.now() - started) / 1000)}s)`);
  };

  try {
    for (let i = 0; i < ids.length; i += batchSize) await runBatch(ids.slice(i, i + batchSize));
  } catch (e) {
    if (!(e instanceof StopRun)) throw e;
    console.log(`Stopping: ${e.message.slice(0, 300)}`);
  }

  const files: string[] = [];
  if (!outDir && statements.length) {
    await mkdir(SQL_DIR, { recursive: true });
    const chunks: string[] = [];
    let chunk = "";
    for (const stmt of statements) {
      if (chunk.length + stmt.length > MAX_CHUNK && chunk) {
        chunks.push(chunk);
        chunk = "";
      }
      chunk += stmt;
    }
    if (chunk) chunks.push(chunk);
    const stamp = batchStamp(new Date());
    for (const [i, sql] of chunks.entries()) {
      files.push(`${SQL_DIR}/shorts-${stamp}-${String(i).padStart(3, "0")}.sql`);
      await writeFile(files[i], sql);
    }
  }
  const summary = `${done - failed.length} shortened, ${failed.length} failed, ${total - done} not processed`;
  console.log(`${summary}${files.length ? `; SQL: ${files.map((f) => f.split("/").at(-1)).join(", ")}` : ""}`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
