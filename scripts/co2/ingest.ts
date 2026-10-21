// Step 1 of the trims pipeline (docs/TRIMS.md): pull every registration year of one make from the EEA data,
// grouped by commercial name and engine, into data-raw/eea/groups/<makeId>.json.
//
//   node scripts/trims/ingest.ts volkswagen bmw

import { mkdir, writeFile } from "node:fs/promises";
import { query, TABLES, type EeaTable } from "./eea.ts";

/** How each make is spelled in the EEA "Mk" column (it varies by country and year). */
const MAKE_PATTERNS: Record<string, string[]> = {
  "alfa-romeo": ["ALFA ROMEO%"],
  audi: ["AUDI%"],
  bmw: ["BMW%"],
  byd: ["BYD%"],
  chevrolet: ["CHEVROLET%"],
  citroen: ["CITRO%"],
  cupra: ["CUPRA%"],
  dacia: ["DACIA%"],
  ds: ["DS", "DS %", "CITROENDS%"],
  fiat: ["FIAT%"],
  ford: ["FORD%"],
  honda: ["HONDA%"],
  hyundai: ["HYUNDAI%"],
  jaguar: ["JAGUAR%"],
  jeep: ["JEEP%"],
  kia: ["KIA%"],
  lancia: ["LANCIA%"],
  // Jaguar Land Rover registered both brands under one name for some years; the model names sort them out.
  "land-rover": ["LAND ROVER%", "JAGUAR LAND ROVER%"],
  lexus: ["LEXUS%"],
  mazda: ["MAZDA%"],
  "mercedes-benz": ["MERCEDES%"],
  mg: ["MG", "MG %"],
  mini: ["MINI%"],
  mitsubishi: ["MITSUBISHI%"],
  nissan: ["NISSAN%"],
  // Vauxhall is the UK name for the same cars.
  opel: ["OPEL%", "VAUXHALL%"],
  peugeot: ["PEUGEOT%"],
  polestar: ["POLESTAR%"],
  porsche: ["PORSCHE%"],
  renault: ["RENAULT%"],
  saab: ["SAAB%"],
  seat: ["SEAT%"],
  skoda: ["SKODA%", "ŠKODA%"],
  smart: ["SMART%"],
  subaru: ["SUBARU%"],
  suzuki: ["SUZUKI%"],
  tesla: ["TESLA%"],
  toyota: ["TOYOTA%"],
  volkswagen: ["VOLKSWAGEN%", "VW"],
  volvo: ["VOLVO%"],
};

/** Groups with fewer registrations in a year are dropped as typos and one-offs. */
const MIN_PER_YEAR = 10;
/** CO2 values reported for fewer cars than this within a group are left out of its histogram. */
const MIN_PER_VALUE = 3;
/**
 * NEDC was the type-approval figure until 2020; the NEDC values reported for later registrations are
 * back-calculated and often junk (e.g. 240 g/km for a car with 180 g/km WLTP), so they are not kept.
 */
const LAST_NEDC_YEAR = 2020;

export interface Group {
  year: number;
  status: "F" | "P";
  mk: string;
  cn: string;
  /** Type from the type approval ("AU" Golf 7, "CD" Golf 8, "G3K"); tells generations apart. Often empty before 2013. */
  t: string;
  ft: string;
  /** Fuel mode: M mono-fuel, B bi-fuel, F flex-fuel, H hybrid, P plug-in hybrid. Empty in older years. */
  fm: string;
  kw: number | null;
  cc: number | null;
  /** Raw Euro norm text from 2023 on ("EURO 6 AP", "Euro 6d/VID"); null before. */
  ech: string | null;
  n: number;
  /** How many cars reported each CO2 value, g/km. One bad country's figures stay a small bump. */
  wltp: Hist;
  /** Up to LAST_NEDC_YEAR only. */
  nedc: Hist;
  massKg: number | null;
  /** Electric energy consumption reported (Wh/km), i.e. the car can drive on electricity. */
  plugin: boolean;
}

/** [value, registrations] pairs. */
export type Hist = [number, number][];

// Up to 2016 the (NEDC) CO2 figure is in "E (g/km)"; "Enedc (g/km)" starts in 2017.
const NEDC = "COALESCE([Enedc (g/km)], [E (g/km)])";

// One row per group and CO2 value pair; the rows of a group are folded together in ingest().
function groupSql(table: EeaTable, patterns: string[]) {
  const mk = patterns.map((p) => `Mk LIKE '${p}'`).join(" OR ");
  const ech = table.hasEch ? "Ech" : "NULL";
  return `SELECT Mk AS mk, Cn AS cn, ISNULL(T, '') AS t, Ft AS ft, ISNULL(Fm, '') AS fm, [Ep (KW)] AS kw, [Ec (cm3)] AS cc,
    ${ech} AS ech, [Ewltp (g/km)] AS wltp, ${NEDC} AS nedc, SUM(R) AS n,
    SUM(CAST([M (kg)] AS float) * R) / NULLIF(SUM(CASE WHEN [M (kg)] IS NOT NULL THEN R END), 0) AS mass,
    MAX(CASE WHEN [Z (Wh/km)] > 0 THEN 1 ELSE 0 END) AS plugin
  FROM ${table.from} AND (${mk}) AND [Ep (KW)] IS NOT NULL
  GROUP BY Mk, Cn, ISNULL(T, ''), Ft, ISNULL(Fm, ''), [Ep (KW)], [Ec (cm3)], ${table.hasEch ? "Ech, " : ""}[Ewltp (g/km)], ${NEDC}
  HAVING SUM(R) >= ${MIN_PER_VALUE}`;
}

type Row = Record<string, string | number | null>;

const clean = (s: unknown) => String(s ?? "").trim().replace(/\s+/g, " ");

function addTo(hist: Hist, value: unknown, n: number) {
  if (value == null) return;
  const v = Math.round(Number(value));
  const entry = hist.find(([x]) => x === v);
  if (entry) entry[1] += n;
  else hist.push([v, n]);
}

async function ingest(makeId: string) {
  const patterns = MAKE_PATTERNS[makeId];
  if (!patterns) throw new Error(`No EEA spelling for "${makeId}"; add it to MAKE_PATTERNS`);
  const groups: Group[] = [];
  for (const table of TABLES) {
    const started = Date.now();
    const rows = await query<Row>(groupSql(table, patterns));
    const byKey = new Map<string, Group & { massSum: number; massN: number }>();
    for (const r of rows) {
      const g = {
        year: table.year,
        status: table.status,
        mk: clean(r.mk),
        cn: clean(r.cn).toUpperCase(),
        t: clean(r.t).toUpperCase(),
        ft: clean(r.ft).toLowerCase(),
        fm: clean(r.fm).toUpperCase(),
        kw: r.kw == null ? null : Number(r.kw),
        cc: r.cc == null ? null : Number(r.cc),
        ech: r.ech ? clean(r.ech) : null,
      };
      const key = JSON.stringify(g);
      const group = byKey.get(key) ?? { ...g, n: 0, wltp: [], nedc: [], massKg: null, plugin: false, massSum: 0, massN: 0 };
      const n = Number(r.n);
      group.n += n;
      addTo(group.wltp, r.wltp, n);
      if (table.year <= LAST_NEDC_YEAR) addTo(group.nedc, r.nedc, n);
      if (r.mass != null) {
        group.massSum += Number(r.mass) * n;
        group.massN += n;
      }
      group.plugin ||= Number(r.plugin) === 1;
      byKey.set(key, group);
    }
    let kept = 0;
    for (const { massSum, massN, ...group } of byKey.values()) {
      if (group.n < MIN_PER_YEAR) continue;
      groups.push({ ...group, massKg: massN ? Math.round(massSum / massN) : null });
      kept++;
    }
    console.log(`${makeId} ${table.year}: ${kept} groups (${((Date.now() - started) / 1000).toFixed(1)} s)`);
  }
  const dir = new URL("../../data-raw/eea/groups/", import.meta.url);
  await mkdir(dir, { recursive: true });
  await writeFile(new URL(`${makeId}.json`, dir), JSON.stringify(groups));
  console.log(`${makeId}: ${groups.length} groups written`);
}

const makes = process.argv.slice(2);
if (!makes.length) {
  console.error("Usage: node scripts/trims/ingest.ts <makeId> [...]");
  process.exit(1);
}
for (const m of makes) await ingest(m);
