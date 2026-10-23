// Finds each model's page on Avto magazin and in the ADAC Autokatalog by probing likely URLs (both sites answer 404
// for unknown models), so the car guide links straight to a page that exists. Models with no hit fall back to a
// search link in src/lib/carLinks.ts. Rerun when models are added to src/data/makes.ts.
//
//   node scripts/carinfo/link-map.ts    # → src/data/carLinks.json

import { writeFile } from "node:fs/promises";
import { MAKES } from "../../src/data/makes.ts";

const OUT = "src/data/carLinks.json";
const JOBS = 4;
const AM = "https://avto-magazin.metropolitan.si/avtomobili";
const ADAC = "https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle";
const ADAC_MAKES: Record<string, string[]> = { volkswagen: ["vw", "vw-nutzfahrzeuge"], ds: ["ds-automobiles"] };

const unique = (xs: string[]) => [...new Set(xs.filter(Boolean))];

/** URL slugs a site might use for one model: "3-series" → "serija-3"/"3er-reihe", "c-class" → "c"/"c-klasse". */
function modelCandidates(slug: string, site: "am" | "adac"): string[] {
  const series = slug.match(/^(\d)-series$/);
  if (series) return site === "am" ? [`serija-${series[1]}`] : [`${series[1]}er-reihe`];
  const cls = slug.match(/^([a-z]+)-class$/);
  if (cls) return site === "am" ? [cls[1], `${cls[1]}-razred`] : [`${cls[1]}-klasse`];
  return unique([slug, slug.replace(/-/g, "")]);
}

async function exists(url: string): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (cargregator link check)" }, redirect: "manual" });
      await res.body?.cancel();
      if (res.status === 200) return true;
      if (res.status === 404 || res.status === 410 || (res.status >= 300 && res.status < 400)) return false;
    } catch {
      // network hiccup: retry
    }
    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
  }
  return false;
}

async function first(urls: string[]): Promise<string | undefined> {
  for (const url of urls) if (await exists(url)) return url;
  return undefined;
}

const jobs = MAKES.flatMap((make) =>
  make.models.map((model) => {
    const slug = model.id.slice(make.id.length + 1);
    return async () => {
      const am = await first(modelCandidates(slug, "am").map((s) => `${AM}/${make.id}/${s}/`));
      const adacMakes = ADAC_MAKES[make.id] ?? [make.id];
      const adac = await first(adacMakes.flatMap((m) => modelCandidates(slug, "adac").map((s) => `${ADAC}/${m}/${s}/`)));
      return [model.id, { ...(am ? { am } : {}), ...(adac ? { adac } : {}) }] as const;
    };
  }),
);

const results: (readonly [string, { am?: string; adac?: string }])[] = [];
let next = 0;
await Promise.all(
  Array.from({ length: JOBS }, async () => {
    while (next < jobs.length) {
      const job = jobs[next++];
      results.push(await job());
      if (results.length % 50 === 0) console.log(`${results.length}/${jobs.length}`);
    }
  }),
);

results.sort(([a], [b]) => a.localeCompare(b));
await writeFile(OUT, JSON.stringify(Object.fromEntries(results), null, 1) + "\n");
const count = (k: "am" | "adac") => results.filter(([, v]) => v[k]).length;
console.log(`${results.length} models: Avto magazin ${count("am")}, ADAC ${count("adac")} → ${OUT}`);
for (const [id, v] of results) if (!v.am || !v.adac) console.log(`  missing ${!v.am ? "am " : ""}${!v.adac ? "adac" : ""}: ${id}`);
