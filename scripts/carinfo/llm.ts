// Shared LLM wrapper for the report pipeline. Dispatches to Claude Code (`claude -p`) or OpenCode Go
// (`opencode run`) depending on `--runner`. Both runners answer the same prompt, validate against the
// same zod schema, and report cost/provenance so the pipeline stays runner-agnostic.

import { spawn } from "node:child_process";
import { z } from "zod";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const OPENCODE_CONFIG_PATH = resolve(__dirname, "opencode.json");

// The CLI's validator doesn't know the draft 2020-12 meta-schema that zod names in "$schema".
export function jsonSchema(schema: z.ZodType): string {
  const { $schema: _, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>;
  return JSON.stringify(rest);
}

export interface AskOptions {
  tools?: string[];
  system?: string;
  cwd?: string;
  timeoutMs?: number;
}

export interface AskResult {
  structured_output?: unknown;
  is_error?: boolean;
  result?: string;
  total_cost_usd?: number;
  num_turns?: number;
}

/** Runs one prompt through `claude -p`. */
export function askClaude(
  prompt: string,
  model: string,
  schema: string,
  { tools = [], system = "You are a careful automotive data analyst. Answer with JSON matching the given schema only.", cwd = process.cwd(), timeoutMs = 15 * 60_000 }: AskOptions = {},
): Promise<AskResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "claude",
      [
        "-p",
        "--model", model,
        "--output-format", "json",
        "--json-schema", schema,
        "--system-prompt", system,
        "--tools", tools.join(","),
        ...(tools.length ? ["--allowedTools", ...tools] : []),
        "--strict-mcp-config",
        "--setting-sources", "",
        "--no-session-persistence",
      ],
      { stdio: ["pipe", "pipe", "pipe"], cwd },
    );
    let out = "";
    let err = "";
    const timer = setTimeout(() => child.kill(), timeoutMs);
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

// Matches provider errors only ("Go usage limit exceeded", quota/credit messages). A bare 429 or "limit" is not
// enough: web pages answer 429 to webfetch all the time, and that must not stop a run.
const USAGE_LIMIT_RE = /usage limit|quota|insufficient (credits|balance|funds)|rate.?limit/i;

/** True when an OpenCode error message or stderr indicates a subscription/model usage limit. */
export function isUsageLimitError(message: string): boolean {
  return USAGE_LIMIT_RE.test(message);
}

/** Extracts the last top-level JSON object from text, whether fenced or bare. */
export function extractJson(text: string): string | undefined {
  // Fenced block: ```json ... ``` or ``` ... ```
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/g);
  if (fenced) {
    const last = fenced.at(-1)!.replace(/```(?:json)?\s*|\s*```/g, "");
    const obj = extractFirstBalancedObject(last);
    if (obj) return obj;
  }
  // Bare object: last balanced { ... } in the text.
  return extractLastBalancedObject(text);
}

function extractFirstBalancedObject(text: string): string | undefined {
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{") {
      const end = findMatchingBrace(text, i);
      if (end !== -1) return text.slice(i, end + 1);
    }
  }
  return undefined;
}

function extractLastBalancedObject(text: string): string | undefined {
  let result: string | undefined;
  let depth = 0;
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    // findMatchingBrace handles strings, so here we just track top-level braces.
    if (ch === '"') {
      // Skip to the end of the string (handles escaped quotes naively enough for brace counting).
      i++;
      while (i < text.length) {
        if (text[i] === "\\") {
          i += 2;
        } else if (text[i] === '"') {
          break;
        } else {
          i++;
        }
      }
      continue;
    }
    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        result = text.slice(start, i + 1);
        start = -1;
      }
    }
  }
  return result;
}

function findMatchingBrace(text: string, start: number): number {
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

interface OpencodeEvent {
  type: string;
  timestamp?: number;
  sessionID?: string;
  part?: {
    type?: string;
    text?: string;
    id?: string;
    tool?: string;
    state?: { status?: string; error?: string; input?: unknown; output?: unknown };
    cost?: number;
    tokens?: { input?: number; output?: number; reasoning?: number; cache?: { read?: number; write?: number } };
    [key: string]: unknown;
  };
  error?: { type?: string; message?: string };
}

/** Parses a stream of `opencode run --format json` newline-delimited events. */
export function parseOpencodeEvents(raw: string): {
  sessionID?: string;
  text: string;
  error?: string;
  totalCostUsd: number;
  tokens: { input: number; output: number; reasoning: number; cacheRead: number; cacheWrite: number };
} {
  let sessionID: string | undefined;
  let text = "";
  let error: string | undefined;
  let totalCostUsd = 0;
  let input = 0;
  let output = 0;
  let reasoning = 0;
  let cacheRead = 0;
  let cacheWrite = 0;

  for (const line of raw.split("\n").map((l) => l.trim()).filter(Boolean)) {
    let ev: OpencodeEvent | undefined;
    try {
      ev = JSON.parse(line) as OpencodeEvent;
    } catch {
      continue;
    }
    if (ev.sessionID && !sessionID) sessionID = ev.sessionID;

    // Tool errors (a page that answered 404 or 429, a failed search) are the model's problem, not the run's, so
    // tool_use events are skipped. Usage limits arrive as top-level error events.
    if (ev.type === "text" && typeof ev.part?.text === "string") {
      text += ev.part.text;
    } else if (ev.type === "error" && ev.error?.message) {
      error = ev.error.message;
    } else if (ev.type === "step_finish" && ev.part) {
      if (typeof ev.part.cost === "number") totalCostUsd += ev.part.cost;
      if (ev.part.tokens) {
        input += ev.part.tokens.input ?? 0;
        output += ev.part.tokens.output ?? 0;
        reasoning += ev.part.tokens.reasoning ?? 0;
        cacheRead += ev.part.tokens.cache?.read ?? 0;
        cacheWrite += ev.part.tokens.cache?.write ?? 0;
      }
    }
  }

  return { sessionID, text, error, totalCostUsd, tokens: { input, output, reasoning, cacheRead, cacheWrite } };
}

function opencodeBin(): string {
  return process.env.OPENCODE_BIN ?? resolve(process.env.HOME ?? "/", ".opencode", "bin", "opencode");
}

async function runOpencodeOnce(
  prompt: string,
  model: string,
  { cwd = process.cwd(), timeoutMs = 30 * 60_000, sessionID }: AskOptions & { sessionID?: string } = {},
): Promise<ReturnType<typeof parseOpencodeEvents> & { stderr: string; exitCode: number | null }> {
  return new Promise((resolve, reject) => {
    const args = [
      "run",
      "--standalone",
      "--auto",
      "--format", "json",
      "--agent", "carinfo-report",
      "-m", model,
      ...(sessionID ? ["--session", sessionID] : []),
    ];
    const child = spawn(opencodeBin(), args, {
      stdio: ["pipe", "pipe", "pipe"],
      cwd,
      env: {
        ...process.env,
        OPENCODE_ENABLE_EXA: "true",
        OPENCODE_CONFIG: OPENCODE_CONFIG_PATH,
      },
    });
    let out = "";
    let err = "";
    const timer = setTimeout(() => child.kill(), timeoutMs);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => {
      clearTimeout(timer);
      const parsed = parseOpencodeEvents(out);
      resolve({ ...parsed, stderr: err, exitCode: code });
    });
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.stdin.end(prompt);
  });
}

/**
 * The only OpenCode Go models Matija allows (the Go budget is shared across models and small). Anything else is
 * refused before a call is made; change this list only on his say-so.
 */
export const OPENCODE_MODELS = ["opencode-go/kimi-k2.7-code", "opencode-go/minimax-m3"] as const;

export function assertOpencodeModel(model: string): void {
  if (!(OPENCODE_MODELS as readonly string[]).includes(model))
    throw new Error(`OpenCode model ${model} is not allowed; use one of: ${OPENCODE_MODELS.join(", ")}`);
}

/** Runs one prompt through `opencode run --format json`, validates the answer, and tries one repair round. */
export async function askOpencode(
  prompt: string,
  model: string,
  schema: z.ZodType,
  options: AskOptions = {},
): Promise<AskResult> {
  assertOpencodeModel(model);
  const schemaText = jsonSchema(schema);
  const fullPrompt = `${prompt.trim()}\n\nAnswer with one JSON object matching this schema:\n${schemaText}`;

  const run = await runOpencodeOnce(fullPrompt, model, options);

  // Surface hard errors (usage limits, provider errors) immediately.
  const hardError = run.error ?? (isUsageLimitError(run.stderr) ? run.stderr : undefined);
  if (hardError) {
    if (isUsageLimitError(hardError)) {
      throw new Error(`OpenCode usage limit: ${hardError}`);
    }
    return { is_error: true, result: hardError, total_cost_usd: run.totalCostUsd };
  }

  const validate = (text: string) => {
    const json = extractJson(text);
    if (!json) return { success: false, error: new Error("No JSON object found in answer"), data: undefined } as const;
    try {
      const parsed = schema.safeParse(JSON.parse(json));
      return parsed.success
        ? ({ success: true, error: undefined, data: parsed.data } as const)
        : ({ success: false, error: new Error(parsed.error.message), data: undefined } as const);
    } catch (e) {
      return { success: false, error: e as Error, data: undefined } as const;
    }
  };

  let result = validate(run.text);

  if (!result.success && run.sessionID) {
    const repair = `Your previous answer failed validation. Fix the JSON and output only a valid JSON object.\n\nErrors:\n${result.error.message}\n\nSchema:\n${schemaText}`;
    const retry = await runOpencodeOnce(repair, model, { ...options, sessionID: run.sessionID });
    const retryError = retry.error ?? (isUsageLimitError(retry.stderr) ? retry.stderr : undefined);
    if (retryError) {
      if (isUsageLimitError(retryError)) throw new Error(`OpenCode usage limit: ${retryError}`);
      // Keep the original validation error if the repair hits a different hard error.
    } else if (retry.text) {
      result = validate(retry.text);
      run.totalCostUsd += retry.totalCostUsd;
    }
  }

  if (!result.success) {
    return {
      is_error: true,
      result: result.error.message,
      total_cost_usd: run.totalCostUsd,
    };
  }

  return {
    structured_output: result.data,
    total_cost_usd: run.totalCostUsd,
    num_turns: 1,
  };
}

export type Runner = "claude" | "opencode";

/** Dispatches to the chosen runner. The prompt and schema contract are the same for both. */
export async function ask(
  prompt: string,
  model: string,
  schema: z.ZodType,
  { runner, ...options }: AskOptions & { runner: Runner },
): Promise<AskResult> {
  if (runner === "opencode") {
    return askOpencode(prompt, model, schema, options);
  }
  return askClaude(prompt, model, jsonSchema(schema), options);
}
