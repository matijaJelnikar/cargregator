// Generates a standalone, guarded SQL patch. Never connects to or writes a database.
// node scripts/carinfo/export-engine-code-repairs.ts
import { mkdir, writeFile } from "node:fs/promises";
import { CODE_FIXES } from "./engine-codes.ts";
import { sqlString as q } from "./sql.ts";

const values = CODE_FIXES.map((f) => `  (${[f.model, f.generation, f.name, f.fuel].map(q).join(", ")}, ${f.kw}, ${f.ccm}, ${q(f.oldCode)}, ${q(f.code)})`).join(",\n");
const sql = `-- Verified engine-type repairs, 2026-11-02. Evidence: docs/ENGINE-CODE-AUDIT.md.
-- Run the entire file in Supabase SQL Editor. No schema migration required.
-- The final result reports each target as updated, already_correct, or blocked.
-- Reviewed/hidden rows and unexpected identities/codes are left unchanged.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

create temp table engine_code_fixes (
  model_id text, generation_slug text, name text, fuel text, kw integer,
  ccm integer, old_code text, new_code text,
  primary key (model_id, generation_slug, name, fuel, kw)
) on commit drop;
insert into engine_code_fixes values
${values};

create temp table engine_code_changes on commit drop as
with changed as (
  update carinfo.engines e
  set engine_code = f.new_code, ccm = f.ccm
  from engine_code_fixes f, carinfo.generations g
  where e.generation_id = g.id
    and g.model_id = f.model_id and g.slug = f.generation_slug
    and e.name = f.name and e.fuel::text = f.fuel and e.kw = f.kw
    and (e.ccm = f.ccm or e.ccm is null)
    and (e.engine_code is not distinct from f.old_code
         or (e.engine_code = f.new_code and e.ccm is null))
    and e.status::text in ('skeleton', 'generated', 'ai_checked')
    and g.status::text in ('skeleton', 'generated', 'ai_checked')
  returning e.id, f.model_id, f.generation_slug, e.name, e.kw,
    f.old_code, e.engine_code as new_code, e.ccm
) select * from changed;

-- Keep this result as the application record. A second run should change no rows.
select f.model_id, f.generation_slug, f.name, f.kw, f.old_code, f.new_code,
  e.engine_code as stored_code, e.ccm as stored_ccm,
  case when c.id is not null then 'updated'
       when e.engine_code = f.new_code and e.ccm = f.ccm then 'already_correct'
       when e.id is null then 'blocked: engine missing or identity changed'
       when e.status::text in ('reviewed', 'hidden') or g.status::text in ('reviewed', 'hidden') then 'blocked: reviewed/hidden'
       else 'blocked: code or displacement changed; inspect manually' end as result
from engine_code_fixes f
left join carinfo.generations g on g.model_id = f.model_id and g.slug = f.generation_slug
left join carinfo.engines e on e.generation_id = g.id and e.name = f.name
  and e.fuel::text = f.fuel and e.kw = f.kw
left join engine_code_changes c on c.id = e.id
order by f.model_id, f.name, f.kw;
commit;
`;
await mkdir("data-raw/carinfo/sql", { recursive: true });
await writeFile("data-raw/carinfo/sql/repair-engine-codes-20261102.sql", sql);
console.log(`Exported ${CODE_FIXES.length} guarded engine corrections.`);
