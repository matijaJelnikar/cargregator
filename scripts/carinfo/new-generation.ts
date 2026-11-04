// Export a researched missing generation and its checked report as one insert-only transaction.
// Never call load_skeleton with a partial model: it can delete sibling skeleton generations/engines.
// node scripts/carinfo/new-generation.ts <pilot-directory> <local-sql-file>
import { readFile, writeFile } from "node:fs/promises";
import { z } from "zod";
import { CARINFO_FUELS, ReportAnswer, VerifyAnswer, hasShorts, engineSlug } from "../../src/lib/carinfo.ts";
import { reportPayload, isHeld } from "./import.ts";
import { matchReportEngines } from "./engine-names.ts";
import { additionPhoto } from "./addition-photo.ts";
import { sqlString as q } from "./sql.ts";

export const NewGeneration = z.object({
  model_id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)+$/),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  aliases: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).default([]),
  name: z.string().min(1), code: z.string().nullable(),
  year_from: z.number().int().min(1950).max(2030), year_to: z.number().int().min(1950).max(2030),
  engines: z.array(z.object({
    name: z.string().min(1), engine_code: z.string().nullable(), fuel: z.enum(CARINFO_FUELS),
    kw: z.number().int().min(10).max(1000), ccm: z.number().int().min(100).max(10000).nullable(),
    year_from: z.number().int().min(1950).max(2030), year_to: z.number().int().min(1950).max(2030),
  })).min(1),
});
export type NewGeneration = z.infer<typeof NewGeneration>;

export function newGenerationSql(raw: unknown, rawReport: unknown, rawCheck: unknown, provenance: string, rawPhoto: unknown) {
  const g = NewGeneration.parse(raw);
  const photo = additionPhoto(rawPhoto, g);
  const a = ReportAnswer.parse(rawReport);
  const v = VerifyAnswer.extend({ http: z.record(z.string(), z.number().int()).optional() }).parse(rawCheck);
  if (g.year_to < g.year_from) throw new Error("Generation years are reversed");
  if (!hasShorts(a)) throw new Error("Report needs short labels");
  if (isHeld(v.failures.filter((f) => f.check === "unsupported").length, a.failures.length)) throw new Error("Report is held back");
  if (v.errors.length) throw new Error("Resolve prose errors and recheck before exporting");
  if (v.failures.length !== a.failures.length || new Set(v.failures.map((f) => f.index)).size !== a.failures.length ||
      v.failures.some((f) => f.index >= a.failures.length)) throw new Error("Every failure must have exactly one check");
  const matched = matchReportEngines(a, g.engines, `${g.model_id}/${g.slug}`);
  if (matched.issues.length) throw new Error(matched.issues.join("; "));
  const slugs = new Set<string>();
  const engines = g.engines.map((e) => {
    if (e.year_from < g.year_from || e.year_to > g.year_to || e.year_to < e.year_from) throw new Error(`Invalid engine years: ${e.name}`);
    const slug = engineSlug(e.name, e.kw);
    if (slugs.has(slug)) throw new Error(`Duplicate engine variant: ${slug}`);
    slugs.add(slug);
    return { ...e, slug };
  });
  const { payload, kept } = reportPayload(matched.answer, v, g.model_id);
  if (!kept) throw new Error("Report has no publishable failure evidence");
  const aliases = [...new Set([g.slug, ...g.aliases])];
  return `-- New-generation pilot: ${g.model_id}/${g.slug}
-- Prepared locally; Matija executes after reviewing the accompanying report.
-- Inserts one generation only. An existing target is a no-op; existing sibling rows are never updated/deleted.
-- registrations = 0 means no EEA count, not that no cars were sold.
begin;
do $pilot$
declare
  gid uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(${q(`carinfo/new-generation/${g.model_id}/${g.slug}`)}, 0));
  perform 1 from carinfo.models where id = ${q(g.model_id)} for key share;
  if not found then raise exception 'Pilot model is absent from carinfo.models'; end if;
  if exists (select 1 from carinfo.generations where model_id = ${q(g.model_id)} and slug = ${q(g.slug)}) then
    raise notice 'Pilot generation already exists; no changes made';
    return;
  end if;
  if exists (select 1 from carinfo.generations where model_id = ${q(g.model_id)}
    and (slug = any(array[${aliases.map(q).join(",")}])${g.code ? ` or lower(code) = lower(${q(g.code)})` : ""})) then
    raise exception 'Possible generation alias exists; reconcile identity before inserting';
  end if;
  insert into carinfo.generations (model_id, slug, name, code, year_from, year_to, registrations, image_url, image_credit, image_license, image_source_url)
  values (${q(g.model_id)}, ${q(g.slug)}, ${q(g.name)}, ${q(g.code)}, ${g.year_from}, ${g.year_to}, 0, ${q(photo.public_url)}, ${q(photo.credit)}, ${q(photo.license)}, ${q(photo.source_url)})
  returning id into gid;

  insert into carinfo.engines (generation_id, slug, name, engine_code, fuel, kw, ccm, year_from, year_to, registrations)
  select gid, e.slug, e.name, e.engine_code, e.fuel::carinfo.fuel, e.kw, e.ccm, e.year_from, e.year_to, 0
  from jsonb_to_recordset(${q(JSON.stringify(engines))}::jsonb)
    as e(slug text, name text, engine_code text, fuel text, kw smallint, ccm smallint, year_from smallint, year_to smallint);

  perform * from carinfo.load_report(gid, ${q(JSON.stringify(payload))}::jsonb, ${q(provenance)});
end;
$pilot$;

select g.id, g.model_id, g.slug, g.status, g.generated_by,
  (select count(*) from carinfo.engines e where e.generation_id = g.id) as engines,
  (select count(*) from carinfo.failures f where f.generation_id = g.id) as failures,
  (select count(*) from carinfo.checks c where c.generation_id = g.id) as checks,
  (select count(*) from carinfo.links l where l.generation_id = g.id) as links
from carinfo.generations g where g.model_id = ${q(g.model_id)} and g.slug = ${q(g.slug)};
commit;
`;
}

async function main() {
  const [dir, out] = process.argv.slice(2);
  if (!dir || !out) throw new Error("usage: new-generation.ts <pilot-directory> data-raw/carinfo/sql/<file.sql>");
  if (!/^data-raw\/carinfo\/sql\/[^/]+\.sql$/.test(out)) throw new Error("Ad hoc SQL belongs in data-raw/carinfo/sql/");
  const read = async (name: string) => JSON.parse(await readFile(`${dir}/${name}.json`, "utf8"));
  const [skeleton, report, check, photo] = await Promise.all([read("skeleton"), read("answer"), read("checked"), read("photo")]);
  await writeFile(out, newGenerationSql(skeleton, report, check, report.generated_by ?? "codex/direct-source-pilot", photo));
  console.log(`Prepared ${out}; no database writes performed.`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
