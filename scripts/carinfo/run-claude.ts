// Answers the skeleton prompts with the Claude Code CLI (`claude -p`), so they run on the Claude subscription
// rather than API credits. Each prompt is one headless call with no tools, MCP servers or project settings, and
// its answer is checked against SkeletonAnswer. Models that already have an answer are skipped, so an
// interrupted run (rate limit, closed terminal) is resumed by running it again.
//
//   node scripts/carinfo/run-claude.ts                              # every prompt without an answer
//   node scripts/carinfo/run-claude.ts volkswagen-golf dacia-duster # some models (re-answers them)
//   node scripts/carinfo/run-claude.ts --model opus --jobs 2        # model alias (default sonnet), parallel calls

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { z } from "zod";
import { SkeletonAnswer } from "../../src/lib/carinfo.ts";
import { SKELETON_DIR } from "./skeleton-prompt.ts";

const PROMPTS = `${SKELETON_DIR}/prompts`;
const ANSWERS = `${SKELETON_DIR}/answers`;
const ERRORS = `${SKELETON_DIR}/errors`;
const TIMEOUT_MS = 15 * 60_000;
const SYSTEM = "You are a careful automotive data analyst. Answer with JSON matching the given schema only.";
// The CLI's validator doesn't know the draft 2020-12 meta-schema that zod names in "$schema".
export function jsonSchema(schema: z.ZodType): string {
  const { $schema: _, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>;
  return JSON.stringify(rest);
}
const SCHEMA = jsonSchema(SkeletonAnswer);

function option(name: string, fallback: string, args: string[]): string {
  const i = args.indexOf(name);
  if (i === -1) return fallback;
  const [, value] = args.splice(i, 2);
  return value;
}

/** Runs one prompt; resolves with the CLI's JSON result or rejects with what went wrong. */
export function ask(prompt: string, model: string, schema = SCHEMA): Promise<{ structured_output?: unknown; is_error?: boolean; result?: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "claude",
      [
        "-p",
        "--model", model,
        "--output-format", "json",
        "--json-schema", schema,
        "--system-prompt", SYSTEM,
        "--tools", "",
        "--strict-mcp-config",
        "--setting-sources", "",
        "--no-session-persistence",
      ],
      { stdio: ["pipe", "pipe", "pipe"], cwd: SKELETON_DIR },
    );
    let out = "";
    let err = "";
    const timer = setTimeout(() => child.kill(), TIMEOUT_MS);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => {
      clearTimeout(timer);
      try {
        resolve(JSON.parse(out));
      } catch {
        reject(new Error(`exit ${code}: ${(err || out).slice(0, 2000)}`));
      }
    });
    child.stdin.end(prompt);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const model = option("--model", "sonnet", args);
  const jobs = Number(option("--jobs", "3", args));

  await mkdir(ANSWERS, { recursive: true });
  await mkdir(ERRORS, { recursive: true });
  const queue = (await readdir(PROMPTS))
    .map((f) => f.replace(/\.md$/, ""))
    .filter((id) => (args.length ? args.includes(id) : !existsSync(`${ANSWERS}/${id}.json`)));
  const total = queue.length;
  let done = 0;
  const failed: string[] = [];

  async function worker() {
    for (let id = queue.shift(); id; id = queue.shift()) {
      const started = Date.now();
      let why: string | undefined;
      try {
        const res = await ask(await readFile(`${PROMPTS}/${id}.md`, "utf8"), model);
        const parsed = SkeletonAnswer.safeParse(res.structured_output);
        if (res.is_error || !parsed.success) why = res.is_error ? `CLI error: ${res.result}` : parsed.error!.message;
        else {
          await writeFile(`${ANSWERS}/${id}.json`, JSON.stringify(parsed.data, null, 2));
          await rm(`${ERRORS}/${id}.txt`, { force: true });
        }
      } catch (e) {
        why = (e as Error).message;
      }
      done++;
      const secs = Math.round((Date.now() - started) / 1000);
      if (why) {
        failed.push(id);
        await writeFile(`${ERRORS}/${id}.txt`, why);
      }
      console.log(`[${done}/${total}] ${id} ${why ? "FAILED" : "ok"} (${secs}s)`);
    }
  }

  await Promise.all(Array.from({ length: Math.min(jobs, total) }, worker));
  console.log(`${total - failed.length} answered, ${failed.length} failed${failed.length ? ` (see ${ERRORS}): ${failed.join(" ")}` : ""}`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
