// Read access to the car-info data (Supabase schema carinfo) over PostgREST. The URL and key are public: the
// publishable key is the anon role, and row level security lets it read published rows only. Plain fetch, so no
// client library is bundled into the worker.

import type { Fuel } from "./filters";

export const REST = "https://wblmhgmotllxffpwsmhb.supabase.co/rest/v1";
export const PUBLISHABLE_KEY = "sb_publishable_f3QEE0kxL0E7HqB2CWMRTg_-Dc-aOb4";
/** Car data changes when we load or review content, not per visit. */
const REVALIDATE_S = 3600;

export interface CarEngine {
  id: string;
  slug: string;
  name: string;
  engine_code: string | null;
  fuel: Fuel;
  kw: number | null;
  ccm: number | null;
  year_from: number | null;
  year_to: number | null;
  registrations: number;
  verdict: "recommended" | "ok" | "avoid" | null;
  score: number | null;
  annual_cost_min: number | null;
  annual_cost_max: number | null;
  summary_sl: string | null;
  summary_en: string | null;
}

export interface CarFailure {
  id: string;
  engine_id: string | null;
  area: "engine" | "gearbox" | "electrics" | "suspension" | "body" | "emissions";
  title_sl: string;
  title_en: string;
  body_sl: string | null;
  body_en: string | null;
  symptoms_sl: string | null;
  symptoms_en: string | null;
  year_from: number | null;
  year_to: number | null;
  likelihood: "low" | "med" | "high";
  cost_min: number | null;
  cost_max: number | null;
  sources: { url: string; title: string }[];
  ai_check: "supported" | "weak" | "unsupported" | null;
  status: string;
}

export interface CarCheck {
  id: string;
  text_sl: string;
  text_en: string;
  sort: number;
}

export interface CarLinkRow {
  id: string;
  kind: "test" | "safety" | "reliability" | "review" | "forum" | "other";
  label: string;
  url: string;
}

export type Bilingual = { sl: string; en: string };

export interface CarRecall {
  id: string;
  authority: string;
  ref: string | null;
  title_en: string;
  title_sl: string | null;
  year_from: number | null;
  year_to: number | null;
  source_url: string;
}

export interface CarGeneration {
  id: string;
  slug: string;
  name: string;
  code: string | null;
  year_from: number;
  year_to: number | null;
  registrations: number;
  /** Photo in Cloudflare R2, with the credit its licence requires. */
  image_url: string | null;
  image_credit: string | null;
  image_license: string | null;
  image_source_url: string | null;
  /** Written report (empty until one is imported with status ai_checked or reviewed). */
  status: "skeleton" | "generated" | "ai_checked" | "reviewed" | "hidden";
  summary_sl: string | null;
  summary_en: string | null;
  pros: Bilingual[];
  cons: Bilingual[];
  ncap_stars: number | null;
  ncap_year: number | null;
  ncap_url: string | null;
  engines: CarEngine[];
  recalls: CarRecall[];
  failures: CarFailure[];
  checks: CarCheck[];
  links: CarLinkRow[];
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${REST}/${path}`, {
    headers: { apikey: PUBLISHABLE_KEY, Authorization: `Bearer ${PUBLISHABLE_KEY}`, "Accept-Profile": "carinfo" },
    next: { revalidate: REVALIDATE_S },
  });
  if (!res.ok) throw new Error(`carinfo ${path}: ${res.status}`);
  return (await res.json()) as T;
}

/** "volkswagen-golf" under make "volkswagen" → "golf" (the URL segment). */
export const modelSlug = (makeId: string, modelId: string) => modelId.slice(makeId.length + 1);

export interface ModelSummary {
  generations: number;
  year_from: number;
  /** null while a generation is still on sale. */
  year_to: number | null;
}

/** Generation count and years on sale per model id of one make, for its make page. */
export async function modelSummaries(makeId: string): Promise<Map<string, ModelSummary>> {
  const rows = await get<{ model_id: string; year_from: number; year_to: number | null }[]>(
    `generations?select=model_id,year_from,year_to,models!inner(make_id)&models.make_id=eq.${encodeURIComponent(makeId)}`,
  );
  const out = new Map<string, ModelSummary>();
  for (const r of rows) {
    const s = out.get(r.model_id);
    if (!s) out.set(r.model_id, { generations: 1, year_from: r.year_from, year_to: r.year_to });
    else {
      s.generations++;
      s.year_from = Math.min(s.year_from, r.year_from);
      s.year_to = s.year_to === null || r.year_to === null ? null : Math.max(s.year_to, r.year_to);
    }
  }
  return out;
}

const LIKELIHOOD = { low: 1, med: 2, high: 3 } as const;

/** Most likely and most expensive first: likelihood times the upper repair cost (unknown cost counts as 500 EUR). */
export const failureWeight = (f: Pick<CarFailure, "likelihood" | "cost_max">) => LIKELIHOOD[f.likelihood] * (f.cost_max ?? 500);

/** A report's text in the page language, falling back to English. */
export const pick = (lang: "sl" | "en", sl: string | null | undefined, en: string | null | undefined) => (lang === "sl" ? sl || en : en || sl) ?? "";

/** Generations of one model with their engines and recalls, oldest first. */
export async function getGenerations(modelId: string): Promise<CarGeneration[]> {
  const select = [
    "id,slug,name,code,year_from,year_to,registrations,image_url,image_credit,image_license,image_source_url",
    "status,summary_sl,summary_en,pros,cons,ncap_stars,ncap_year,ncap_url",
    "engines(id,slug,name,engine_code,fuel,kw,ccm,year_from,year_to,registrations,verdict,score,annual_cost_min,annual_cost_max,summary_sl,summary_en)",
    "recalls(id,authority,ref,title_en,title_sl,year_from,year_to,source_url)",
    "failures(id,engine_id,area,title_sl,title_en,body_sl,body_en,symptoms_sl,symptoms_en,year_from,year_to,likelihood,cost_min,cost_max,sources,ai_check,status)",
    "checks(id,text_sl,text_en,sort)",
    "links(id,kind,label,url)",
  ].join(",");
  const rows = await get<CarGeneration[]>(`generations?model_id=eq.${encodeURIComponent(modelId)}&select=${select}&order=year_from.asc`);
  const byPower = (a: CarEngine, b: CarEngine) => a.fuel.localeCompare(b.fuel) || (a.kw ?? 0) - (b.kw ?? 0);
  return rows.map((g) => ({
    ...g,
    engines: [...g.engines].sort(byPower),
    recalls: [...g.recalls].sort((a, b) => (b.year_to ?? 0) - (a.year_to ?? 0)),
    failures: [...g.failures].sort((a, b) => failureWeight(b) - failureWeight(a)),
    checks: [...g.checks].sort((a, b) => a.sort - b.sort),
  }));
}

/** Public "report an error" form: anon may insert unresolved reports and nothing else (RLS), so no row is returned. */
export async function reportError(r: { message: string; pageUrl: string; generationId?: string; engineId?: string }): Promise<void> {
  const res = await fetch(`${REST}/reports`, {
    method: "POST",
    headers: {
      apikey: PUBLISHABLE_KEY,
      Authorization: `Bearer ${PUBLISHABLE_KEY}`,
      "Content-Profile": "carinfo",
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ message: r.message, page_url: r.pageUrl.slice(0, 500), generation_id: r.generationId ?? null, engine_id: r.engineId ?? null }),
  });
  if (!res.ok) throw new Error(`carinfo report: ${res.status}`);
}
