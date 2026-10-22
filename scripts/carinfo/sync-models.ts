// Mirrors src/data/makes.ts into carinfo.makes / carinfo.models so car-info rows have real foreign keys.
// Writes upsert SQL that is applied through the Supabase MCP (execute_sql); makes.ts stays the source of truth.
//
//   node scripts/carinfo/sync-models.ts    # → data-raw/carinfo/sql/sync-models.sql

import { mkdir, writeFile } from "node:fs/promises";
import { MAKES } from "../../src/data/makes.ts";
import { sqlString as q } from "./sql.ts";

const OUT_DIR = "data-raw/carinfo/sql";

const makes = MAKES.map((m) => `(${q(m.id)}, ${q(m.name)})`);
const models = MAKES.flatMap((m) => m.models.map((mo) => `(${q(mo.id)}, ${q(m.id)}, ${q(mo.name)})`));

const sql = `insert into carinfo.makes (id, name) values
${makes.join(",\n")}
on conflict (id) do update set name = excluded.name;

insert into carinfo.models (id, make_id, name) values
${models.join(",\n")}
on conflict (id) do update set make_id = excluded.make_id, name = excluded.name;
`;

await mkdir(OUT_DIR, { recursive: true });
await writeFile(`${OUT_DIR}/sync-models.sql`, sql);
console.log(`${makes.length} makes, ${models.length} models → ${OUT_DIR}/sync-models.sql`);
