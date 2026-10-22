// Layer 2 of the car-info data: recalls from the EU Safety Gate weekly reports (category "Motor vehicles"),
// mapped to generations by make, model and production years. Reports are cached in data-raw/carinfo/recalls,
// so an interrupted run resumes. Writes data-raw/carinfo/sql/recalls-NNN.sql (insert ... on conflict do nothing),
// applied in the Supabase SQL editor, plus recalls-report.md.
//
//   node scripts/carinfo/recalls.ts

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { MAKES } from "../../src/data/makes.ts";
import { SKELETON_DIR } from "./skeleton-prompt.ts";

const CACHE = "data-raw/carinfo/recalls";
const SQL_DIR = "data-raw/carinfo/sql";
/** Bytes of payload per SQL file, so each file can be pasted into the SQL editor. */
const CHUNK = 60_000;
const ALERT_URL =
  "https://ec.europa.eu/safety-gate-alerts/screen/webReport/alertDetail/";
const FIRST_YEAR = 2005;
const LAST_YEAR = 2026;
const JOBS = 4;
const ATTEMPTS = 6;
/** Safety Gate reports before this year don't matter for cars on the market since 2011. */
const SAFETY_GATE_FROM = 2011;

interface Generation {
  slug: string;
  from: number;
  to: number | null;
}
interface Row {
  model_id: string;
  gen: string;
  authority: string;
  ref: string;
  title_en: string;
  year_from: number;
  year_to: number;
  source_url: string;
}

async function text(url: string): Promise<string> {
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
      if (res.ok) return await res.text();
    } catch {}
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
  throw new Error(`failed: ${url}`);
}

/** Runs fn over items with a fixed number of parallel workers. */
async function pool<T>(items: T[], fn: (item: T, i: number) => Promise<void>) {
  const queue = items.map((item, i) => [item, i] as const);
  await Promise.all(
    Array.from({ length: JOBS }, async () => {
      for (let next = queue.shift(); next; next = queue.shift())
        await fn(next[0], next[1]);
    }),
  );
}

/** Generations of every model, from the skeleton answers (EEA-backed or knowledge-only). */
async function generationsByModel(): Promise<Map<string, Generation[]>> {
  const out = new Map<string, Generation[]>();
  for (const dir of [`${SKELETON_DIR}/answers`, `${SKELETON_DIR}/knowledge`]) {
    for (const make of MAKES) {
      for (const m of make.models) {
        const file = `${dir}/${m.id}.json`;
        if (!existsSync(file)) continue;
        const a = JSON.parse(await readFile(file, "utf8")) as {
          generations: {
            slug: string;
            year_from: number;
            year_to: number | null;
          }[];
        };
        out.set(
          m.id,
          a.generations.map((g) => ({
            slug: g.slug,
            from: g.year_from,
            to: g.year_to,
          })),
        );
      }
    }
  }
  return out;
}

const generationOf = (gens: Generation[], year: number) =>
  gens.find((g) => year >= g.from && year <= (g.to ?? 9999));

/** Collapses (generation, campaign) pairs seen in several years into one row with the year range. */
function collect(
  rows: Map<string, Row>,
  base: Omit<Row, "year_from" | "year_to">,
  year: number,
) {
  const key = `${base.model_id}|${base.gen}|${base.authority}|${base.ref}`;
  const row = rows.get(key);
  if (row) {
    row.year_from = Math.min(row.year_from, year);
    row.year_to = Math.max(row.year_to, year);
  } else rows.set(key, { ...base, year_from: year, year_to: year });
}

const unCdata = (s: string) =>
  s
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .trim();
const field = (xml: string, tag: string) =>
  unCdata(xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1] ?? "");

async function safetyGate(
  gens: Map<string, Generation[]>,
  rows: Map<string, Row>,
  report: string[],
) {
  await mkdir(`${CACHE}/safety-gate`, { recursive: true });
  const list = await text(
    "https://ec.europa.eu/safety-gate-alerts/api/download/weeklyReport/list/xml/en",
  );
  const reports = [
    ...list.matchAll(
      /<reference>([^<]*)<\/reference>[\s\S]*?<year>(\d+)<\/year>[\s\S]*?<URL>([^<]*)<\/URL>/g,
    ),
  ]
    .map((m) => ({
      ref: m[1],
      year: Number(m[2]),
      url: m[3].replace(/&amp;/g, "&"),
    }))
    .filter((r) => r.year >= SAFETY_GATE_FROM);

  await pool(reports, async (r, i) => {
    const file = `${CACHE}/safety-gate/${r.ref}.json`;
    if (!existsSync(file)) {
      const xml = await text(r.url);
      const alerts = xml
        .split("<notifications ")
        .filter((n) => field(n, "category") === "Motor vehicles")
        .map((n) =>
          Object.fromEntries(
            [
              "caseNumber",
              "reference",
              "product",
              "brand",
              "name",
              "type_numberOfModel",
              "danger",
              "description",
              "productionDates",
            ].map((t) => [t, field(n, t)]),
          ),
        );
      await writeFile(file, JSON.stringify(alerts));
    }
    if (i % 50 === 0) console.log(`safety-gate ${i}/${reports.length}`);
  });

  /** Lowercase words without accents ("Škoda" → "skoda"), padded so whole words can be found with includes(). */
  const norm = (s: string) =>
    ` ${s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()} `;
  /** Brands that Safety Gate writes differently from our make names. */
  const BRAND_ALIASES: Record<string, string> = {
    " vw ": "volkswagen",
    " mercedes ": "mercedes-benz",
    " vauxhall ": "opel",
  };
  const makeOf = (brand: string) => {
    const b = norm(brand);
    const alias = Object.entries(BRAND_ALIASES).find(([k]) =>
      b.includes(k),
    )?.[1];
    return MAKES.find(
      (m) => m.id === alias || b.includes(norm(m.name)) || b === norm(m.id),
    );
  };
  let alerts = 0;
  let unmatched = 0;
  for (const r of reports) {
    const found = JSON.parse(
      await readFile(`${CACHE}/safety-gate/${r.ref}.json`, "utf8"),
    ) as Record<string, string>[];
    for (const a of found) {
      alerts++;
      const make = makeOf(a.brand);
      // One alert often lists several models ("Polo, Golf, Passat"). Longest names first, and a matched name is
      // removed from the text so "A4" doesn't also match inside "A4 Allroad". The commercial name is the list of
      // models; the description is only used when it is empty, since it mentions other models in passing.
      let hay = norm(
        a.name || `${a.type_numberOfModel} ${a.product} ${a.description}`,
      );
      const models = (make?.models ?? [])
        .filter((m) => gens.has(m.id))
        .sort((x, y) => y.name.length - x.name.length)
        .filter((m) => {
          // "ID.3" is written "ID3" in some alerts, "e-tron" as "etron": also try the name without separators.
          const n = norm(m.name);
          const found = [n, ` ${n.trim().replace(/ /g, "")} `].find((v) =>
            hay.includes(v),
          );
          if (!found) return false;
          hay = hay.split(found).join(" ");
          return true;
        });
      const years = [...a.productionDates.matchAll(/\b(19|20)\d{2}\b/g)].map(
        (m) => Number(m[0]),
      );
      if (!make || !models.length || !years.length) {
        unmatched++;
        report.push(
          `- unmatched ${a.caseNumber}: ${a.brand} / ${a.name} / ${a.type_numberOfModel} (${a.productionDates || "no dates"})`,
        );
        continue;
      }
      const from = Math.min(...years);
      const to = Math.max(...years);
      for (const model of models) {
        for (let y = from; y <= to; y++) {
          const gen = generationOf(gens.get(model.id)!, y);
          if (!gen) continue;
          collect(
            rows,
            {
              model_id: model.id,
              gen: gen.slug,
              authority: "EU Safety Gate",
              ref: a.caseNumber,
              title_en: `${a.product}: ${a.name || a.type_numberOfModel}`
                .replace(/\s+/g, " ")
                .slice(0, 200),
              source_url: a.reference,
            },
            y,
          );
        }
      }
    }
  }
  report.push(
    `\nSafety Gate: ${alerts} motor vehicle alerts since ${SAFETY_GATE_FROM}, ${unmatched} not matched to a model or without production dates.`,
  );
}

async function main() {
  const gens = await generationsByModel();
  const rows = new Map<string, Row>();
  const report = ["# Recalls report\n"];
  await safetyGate(gens, rows, report);

  const all = [...rows.values()];
  const perAuthority = Object.entries(
    Object.groupBy(all, (r) => r.authority),
  ).map(([a, r]) => `${a}: ${r!.length}`);
  report.unshift(
    `${all.length} recalls (${perAuthority.join(", ")}) over ${new Set(all.map((r) => r.model_id)).size} models\n`,
  );
  await mkdir(SQL_DIR, { recursive: true });
  const files: string[][] = [[]];
  let size = 0;
  for (const r of all) {
    if (!r.source_url.startsWith(ALERT_URL))
      throw new Error(`unexpected source_url ${r.source_url}`);
    const json = JSON.stringify([
      r.model_id,
      r.gen,
      r.ref,
      r.title_en,
      r.year_from,
      r.year_to,
      r.source_url.slice(ALERT_URL.length),
    ]);
    if (size + json.length > CHUNK && files.at(-1)!.length) {
      files.push([]);
      size = 0;
    }
    files.at(-1)!.push(json);
    size += json.length;
  }
  // Reloading replaces the previous Safety Gate rows: run recalls-000.sql first, then the numbered files.
  await writeFile(
    `${SQL_DIR}/recalls-000.sql`,
    "delete from carinfo.recalls where authority = 'EU Safety Gate';\n",
  );
  for (const [i, chunk] of files.entries()) {
    await writeFile(
      `${SQL_DIR}/recalls-${String(i + 1).padStart(3, "0")}.sql`,
      `insert into carinfo.recalls (generation_id, authority, ref, title_en, year_from, year_to, source_url)
select g.id, 'EU Safety Gate', r.v->>2, r.v->>3, (r.v->>4)::int, (r.v->>5)::int, '${ALERT_URL}' || (r.v->>6)
from jsonb_array_elements($json$[${chunk.join(",\n")}]$json$::jsonb) as r(v)
join carinfo.generations g on g.model_id = r.v->>0 and g.slug = r.v->>1
on conflict do nothing;
`,
    );
  }
  await writeFile(`${CACHE}/recalls-report.md`, report.join("\n"));
  console.log(report[0]);
  console.log(`→ ${files.length} files recalls-NNN.sql in ${SQL_DIR}`);
}

await main();
