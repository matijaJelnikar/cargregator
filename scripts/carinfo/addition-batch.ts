// Assemble directly researched additions into one atomic local SQL file. Never connects to the database or an AI CLI.
// node scripts/carinfo/addition-batch.ts <additions-root> <snapshot.json> data-raw/carinfo/sql/<batch.sql>
import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { MAKES } from "../../src/data/makes.ts";
import { NewGeneration, newGenerationSql } from "./new-generation.ts";
import { additionPhoto } from "./addition-photo.ts";
import { ReportAnswer } from "../../src/lib/carinfo.ts";

export interface AdditionInput { skeleton: unknown; answer: unknown; checked: unknown; photo: unknown }
export interface ExistingGeneration { model_id: string; slug: string; code?: string | null }

export function buildAdditionBatch(inputs: AdditionInput[], existing: ExistingGeneration[]) {
  const taxonomy = new Set(MAKES.flatMap((make) => make.models.map((m) => m.id)));
  const seen = new Set<string>();
  const statements: string[] = [];
  const included: string[] = [];
  const skipped: string[] = [];
  for (const input of inputs) {
    const g = NewGeneration.parse(input.skeleton);
    const target = `${g.model_id}/${g.slug}`;
    if (seen.has(target)) throw new Error(`Duplicate batch target: ${target}`);
    seen.add(target);
    if (!taxonomy.has(g.model_id)) throw new Error(`Add and verify model taxonomy first: ${g.model_id}`);
    if (existing.some((row) => row.model_id === g.model_id && row.slug === g.slug)) {
      skipped.push(target);
      continue;
    }
    if (existing.some((row) => row.model_id === g.model_id &&
      (g.aliases.includes(row.slug) || (g.code !== null && row.code?.toLowerCase() === g.code.toLowerCase())))) {
      throw new Error(`Possible existing generation alias: ${target}`);
    }
    const answer = input.answer as { generated_by?: unknown };
    if (typeof answer.generated_by !== "string" || !answer.generated_by.startsWith("codex/direct-source")) {
      throw new Error(`Direct-research provenance required: ${target}`);
    }
    const sql = newGenerationSql(g, input.answer, input.checked, answer.generated_by, additionPhoto(input.photo, g));
    // Each validated insertion is a DO block plus a receipt SELECT. Keep a single transaction for the entire batch.
    statements.push(sql.replace(/^begin;\n/m, "").replace(/^commit;\n/m, ""));
    included.push(target);
  }
  if (!included.length) throw new Error("No absent, ready additions to export");
  const sql = `-- Missing-car additions: ${included.length} generations\n-- Prepared for Matija; no remote execution by this script. Entire batch is atomic.\n-- Targets: ${included.join(", ")}\nbegin;\n\n${statements.join("\n")}\ncommit;\n`;
  return { sql, included, skipped, sha256: createHash("sha256").update(sql).digest("hex") };
}

export function additionPreview(rawSkeleton: unknown, rawAnswer: unknown) {
  const g = NewGeneration.parse(rawSkeleton);
  const a = ReportAnswer.parse(rawAnswer);
  const lines = [`# ${g.name} — direct-source addition`, "", `${g.year_from}–${g.year_to} · ${g.code ?? g.slug}`, ""];
  for (const [lang, title] of [["sl", "Slovenščina"], ["en", "English"]] as const) {
    lines.push(`## ${title}`, "", a.summary[lang], "", "### Pros / prednosti", "");
    lines.push(...a.pros.map((x) => `- **${x.short?.[lang]}** — ${x[lang]}`));
    lines.push("", "### Cons / slabosti", "", ...a.cons.map((x) => `- **${x.short?.[lang]}** — ${x[lang]}`));
    lines.push("", "### Engines / motorji", "");
    for (const e of a.engines) lines.push(`**${e.name} · ${e.verdict} · ${e.score}/10**`, "", e.summary[lang], "");
    lines.push("### Inspection risks / težave za pregled", "");
    for (const f of a.failures) {
      lines.push(`**${f.title[lang]}${f.engine ? ` · ${f.engine}` : ""}**`, "", f.body[lang], "", f.symptoms[lang], "");
      lines.push(...f.sources.map((s) => `- [${s.title}](${s.url})`), "");
    }
    lines.push("### Before buying / pred nakupom", "", ...a.checks.map((c) => `- ${c[lang]}`), "");
  }
  lines.push("## Catalogue", "", "| Engine | Fuel | kW | cc | Years |", "| --- | --- | --- | --- | --- |");
  lines.push(...g.engines.map((e) => `| ${e.name} | ${e.fuel} | ${e.kw} | ${e.ccm ?? "unknown"} | ${e.year_from}–${e.year_to} |`));
  lines.push("", "Costs are unknown unless supplied. Scores and likelihood categories are editorial judgements, not failure-rate measurements.", "");
  return lines.join("\n");
}

async function main() {
  const [root, snapshotPath, out] = process.argv.slice(2);
  if (!root || !snapshotPath || !out || !/^data-raw\/carinfo\/sql\/[^/]+\.sql$/.test(out)) {
    throw new Error("usage: addition-batch.ts <additions-root> <snapshot.json> data-raw/carinfo/sql/<batch.sql>");
  }
  const inputs: AdditionInput[] = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = `${root}/${entry.name}`;
    const read = async (name: string) => JSON.parse(await readFile(`${dir}/${name}.json`, "utf8"));
    const [skeleton, answer, checked, photo] = await Promise.all([read("skeleton"), read("answer"), read("checked"), read("photo")]);
    inputs.push({ skeleton, answer, checked, photo });
  }
  const existing = JSON.parse(await readFile(snapshotPath, "utf8")) as ExistingGeneration[];
  const batch = buildAdditionBatch(inputs, existing);
  await writeFile(out, batch.sql);
  await writeFile(`${out}.manifest.json`, JSON.stringify({ included: batch.included, skipped: batch.skipped, sha256: batch.sha256 }, null, 2) + "\n");
  for (const input of inputs) {
    const g = NewGeneration.parse(input.skeleton);
    const photo = additionPhoto(input.photo, g);
    await writeFile(`${root}/${g.model_id}--${g.slug}/preview.md`, additionPreview(g, input.answer) + `\n## Generation photograph\n\n![${g.name}](photo.webp)\n\n${photo.credit} · ${photo.license} · [Source](${photo.source_url})\n`);
  }
  console.log(`${batch.included.length} additions, ${batch.skipped.length} already present → ${out}; no database writes.`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
