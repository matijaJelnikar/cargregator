// Where the report run stands, for whoever continues it (Claude Code, OpenCode, Matija): writes
// docs/CARINFO-PROGRESS.md (committed) from the files in data-raw/carinfo/reports. It is a log, not the source of
// truth: report.ts, verify.ts and import.ts each skip work whose output already exists, so rerunning them is always
// safe. Run it after each pipeline step.
//
//   node scripts/carinfo/progress.ts

import { existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { carName, loadGenerations, REPORT_DIR } from "./report.ts";

const OUT = "docs/CARINFO-PROGRESS.md";

export type State = "exported" | "held" | "checked" | "written" | "failed" | "todo";

const LABEL: Record<State, string> = {
  exported: "exported to SQL (handed to Matija to load)",
  held: "held back (sources too weak, not exported)",
  checked: "checked, waiting for import.ts",
  written: "written, waiting for verify.ts",
  failed: "failed (see reports/errors/, rerun)",
  todo: "not started",
};

export interface Row {
  rank: number;
  id: string;
  label: string;
  registrations: number;
  state: State;
  by: string;
}

/** The furthest pipeline step a generation has reached, from which files exist for it. */
export function stateOf(f: { answer: boolean; checked: boolean; exported: boolean; held: boolean; error: boolean }): State {
  if (f.exported) return "exported";
  if (f.held) return "held";
  if (f.checked) return "checked";
  if (f.answer) return "written";
  if (f.error) return "failed";
  return "todo";
}

export function renderProgress(rows: Row[], now: Date): string {
  const count = (s: State) => rows.filter((r) => r.state === s).length;
  const byRunner = new Map<string, number>();
  for (const r of rows) if (r.by) byRunner.set(r.by, (byRunner.get(r.by) ?? 0) + 1);
  const list = (s: State, limit = Infinity) =>
    rows
      .filter((r) => r.state === s)
      .slice(0, limit)
      .map((r) => `| ${r.rank} | ${r.label} | ${r.registrations.toLocaleString("en")} | ${r.by} |`);
  const table = (lines: string[]) => (lines.length ? ["| rank | generation | registrations | written by |", "|---|---|---|---|", ...lines].join("\n") : "_none_");
  const states: State[] = ["exported", "held", "checked", "written", "failed", "todo"];

  return `# Car reports: progress

Generated ${now.toISOString().slice(0, 16).replace("T", " ")} UTC by \`node scripts/carinfo/progress.ts\`. Do not edit by hand.

**To continue:** rerun the same commands; each skips finished work.
1. \`node scripts/carinfo/report.ts --all\` writes reports, most registered first. Claude by default, or
   \`--runner opencode --model opencode-go/<kimi-k2.7-code|minimax-m3|gpt-5.6-luna>\`.
2. \`node scripts/carinfo/verify.ts\` checks them.
3. \`node scripts/carinfo/import.ts\` writes SQL for new checked reports.
4. \`node scripts/carinfo/progress.ts\` refreshes this file.

Loading the SQL into Supabase is Matija's step. "exported" means the SQL was written, not that it was loaded.

## Summary

| state | generations |
|---|---|
${states.map((s) => `| ${LABEL[s]} | ${count(s)} |`).join("\n")}
| **total** | **${rows.length}** |

Written by: ${[...byRunner].map(([k, v]) => `${k} ${v}`).join(", ") || "nobody yet"}.

## Next up (first 30 not started, by registrations)

${table(list("todo", 30))}

## Failed

${table(list("failed"))}

## Held back

${table(list("held"))}

## Waiting for a check

${table(list("written"))}

## Checked, not exported

${table(list("checked"))}

## Exported

${table(list("exported"))}
`;
}

async function main() {
  const dir = (d: string) => readdir(`${REPORT_DIR}/${d}`).catch(() => [] as string[]);
  const ids = (files: string[], ext: string) => new Set(files.filter((f) => f.endsWith(ext) && !f.endsWith(`.orig${ext}`)).map((f) => f.slice(0, -ext.length)));
  const answers = ids(await dir("answers"), ".json");
  const checked = ids(await dir("checked"), ".json");
  const errors = ids(await dir("errors"), ".txt");
  const exported: Record<string, number> = existsSync(`${REPORT_DIR}/exported.json`) ? JSON.parse(await readFile(`${REPORT_DIR}/exported.json`, "utf8")) : {};
  const report = existsSync(`${REPORT_DIR}/import-report.md`) ? await readFile(`${REPORT_DIR}/import-report.md`, "utf8") : "";
  const held = new Set([...report.matchAll(/^\| (\S+) \| HELD \|/gm)].map((m) => m[1]));

  const gens = (await loadGenerations([])).sort((a, b) => b.registrations - a.registrations);
  const rows: Row[] = [];
  for (const [i, g] of gens.entries()) {
    const { make, model } = carName(g.model_id);
    const slug = `${g.model_id}/${g.slug}`;
    let by = "";
    if (answers.has(g.id)) {
      const raw = JSON.parse(await readFile(`${REPORT_DIR}/answers/${g.id}.json`, "utf8"));
      by = `${raw.runner ?? "claude"}/${raw.model ?? "sonnet"}`;
    }
    const state = stateOf({ answer: answers.has(g.id), checked: checked.has(g.id), exported: g.id in exported, held: held.has(slug), error: errors.has(g.id) });
    // Generation names usually repeat the model ("Logan II"), sometimes not ("W204").
    const name = g.name.startsWith(model) ? `${make} ${g.name}` : `${make} ${model} ${g.name}`;
    rows.push({ rank: i + 1, id: g.id, label: `${name} (\`${slug}\`)`, registrations: g.registrations, state, by });
  }
  await writeFile(OUT, renderProgress(rows, new Date()));
  const summary = (["exported", "held", "checked", "written", "failed", "todo"] as State[]).map((s) => `${s} ${rows.filter((r) => r.state === s).length}`).join(", ");
  console.log(`${summary} → ${OUT}`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
