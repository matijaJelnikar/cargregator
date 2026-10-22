// Read access to the car-info data (Supabase schema carinfo) over PostgREST. The URL and key are public: the
// publishable key is the anon role, and row level security lets it read published rows only. Plain fetch, so no
// client library is bundled into the worker.

import type { Fuel } from "./filters";

const REST = "https://wblmhgmotllxffpwsmhb.supabase.co/rest/v1";
const PUBLISHABLE_KEY = "sb_publishable_f3QEE0kxL0E7HqB2CWMRTg_-Dc-aOb4";
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
}

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
  engines: CarEngine[];
  recalls: CarRecall[];
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

/** Number of generations per model id, for the index. */
export async function generationCounts(): Promise<Map<string, number>> {
  const rows = await get<{ id: string; generations: { count: number }[] }[]>("models?select=id,generations(count)");
  return new Map(rows.map((r) => [r.id, r.generations[0]?.count ?? 0]));
}

/** Generations of one model with their engines and recalls, oldest first. */
export async function getGenerations(modelId: string): Promise<CarGeneration[]> {
  const select = [
    "id,slug,name,code,year_from,year_to,registrations",
    "engines(id,slug,name,engine_code,fuel,kw,ccm,year_from,year_to,registrations)",
    "recalls(id,authority,ref,title_en,title_sl,year_from,year_to,source_url)",
  ].join(",");
  const rows = await get<CarGeneration[]>(`generations?model_id=eq.${encodeURIComponent(modelId)}&select=${select}&order=year_from.asc`);
  const byPower = (a: CarEngine, b: CarEngine) => a.fuel.localeCompare(b.fuel) || (a.kw ?? 0) - (b.kw ?? 0);
  return rows.map((g) => ({
    ...g,
    engines: [...g.engines].sort(byPower),
    recalls: [...g.recalls].sort((a, b) => (b.year_to ?? 0) - (a.year_to ?? 0)),
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
