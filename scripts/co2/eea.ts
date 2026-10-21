// EEA "Monitoring of CO2 emissions from passenger cars" (Regulation (EU) 2019/631, art. 7), queried through
// DiscoData, the EEA's SQL endpoint, so the multi-GB CSVs never have to be downloaded.
// Table names come from the EEA catalogue records; a new year means adding one line to TABLES.

const ENDPOINT = "https://discodata.eea.europa.eu/sql";
const PAGE_SIZE = 5000;

export interface EeaTable {
  year: number;
  /** FROM clause, including the status filter for the shared table. */
  from: string;
  /** Final or provisional data. */
  status: "F" | "P";
  /** The Euro norm column (Ech) only exists from the 2023 data on. */
  hasEch: boolean;
}

const LATEST = "[CO2Emission].[latest]";

// 2010 is left out: it has no engine power at all, and a quarter of 2011 has none either.
export const TABLES: EeaTable[] = [
  ...Array.from({ length: 11 }, (_, i) => 2011 + i).map((year) => ({
    year,
    from: `${LATEST}.[co2cars] WHERE Year = ${year} AND Status = 'F'`,
    status: "F" as const,
    hasEch: false,
  })),
  { year: 2022, from: `${LATEST}.[co2cars_2022Fv26] WHERE 1 = 1`, status: "F", hasEch: false },
  { year: 2023, from: `${LATEST}.[co2cars_2023Fv28] WHERE 1 = 1`, status: "F", hasEch: true },
  { year: 2024, from: `${LATEST}.[co2cars_2024Fv30] WHERE 1 = 1`, status: "F", hasEch: true },
  { year: 2025, from: `${LATEST}.[co2cars_2025Pv31] WHERE 1 = 1`, status: "P", hasEch: true },
];

/** Runs one query and follows the pages until a short page comes back. */
export async function query<T>(sql: string): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 1; ; page++) {
    const url = `${ENDPOINT}?${new URLSearchParams({ query: sql, p: String(page), nrOfHits: String(PAGE_SIZE) })}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`DiscoData ${res.status}: ${await res.text()}`);
    const body = (await res.json()) as { results?: T[]; errors?: { error: string }[] };
    if (body.errors?.length) throw new Error(`DiscoData: ${body.errors.map((e) => e.error).join("; ")}\n${sql}`);
    const results = body.results ?? [];
    rows.push(...results);
    if (results.length < PAGE_SIZE) return rows;
  }
}
