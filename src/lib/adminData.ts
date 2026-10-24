// Queries for the review site, run with the admin's token (lib/adminAuth). Admins see every status through RLS.

import { MAKES } from "@/data/makes";
import { adminRest } from "./adminAuth";
import { modelSlug, type CarGeneration } from "./carinfoDb";

export type Status = CarGeneration["status"];
export const STATUSES: Status[] = ["skeleton", "generated", "ai_checked", "reviewed", "hidden"];
export const STATUS_LABEL: Record<Status, string> = {
  skeleton: "brez poročila",
  generated: "napisano",
  ai_checked: "AI preverjeno",
  reviewed: "pregledano",
  hidden: "skrito",
};

export interface QueueRow {
  id: string;
  model_id: string;
  slug: string;
  name: string;
  year_from: number;
  year_to: number | null;
  status: Status;
  ai_confidence: number | null;
  registrations: number;
  /** Unresolved public error reports. */
  reports: number;
  /** Failures the check pass found only weakly (or not) supported, still shown. */
  weak: number;
}

export function carNames(modelId: string) {
  for (const make of MAKES) for (const m of make.models) if (m.id === modelId) return { make, model: m };
  return null;
}

export function publicUrl(modelId: string) {
  const c = carNames(modelId);
  return c ? `/sl/avti/${c.make.id}/${modelSlug(c.make.id, modelId)}/` : null;
}

const countBy = (rows: { generation_id: string | null }[]) => {
  const m = new Map<string, number>();
  for (const r of rows) if (r.generation_id) m.set(r.generation_id, (m.get(r.generation_id) ?? 0) + 1);
  return m;
};

/** Every generation with its review flags; flagged ones first, then by registrations. */
export async function queue(token: string): Promise<QueueRow[]> {
  const [gens, reports, weak] = await Promise.all([
    adminRest<Omit<QueueRow, "reports" | "weak">[]>(token, "generations?select=id,model_id,slug,name,year_from,year_to,status,ai_confidence,registrations&limit=5000"),
    adminRest<{ generation_id: string | null }[]>(token, "reports?resolved=is.false&select=generation_id&limit=5000"),
    adminRest<{ generation_id: string | null }[]>(token, "failures?ai_check=in.(weak,unsupported)&status=neq.hidden&select=generation_id&limit=20000"),
  ]);
  const r = countBy(reports);
  const w = countBy(weak);
  return gens
    .map((g) => ({ ...g, reports: r.get(g.id) ?? 0, weak: w.get(g.id) ?? 0 }))
    .sort((a, b) => b.reports - a.reports || b.registrations - a.registrations);
}

export interface ReviewGeneration {
  id: string;
  model_id: string;
  slug: string;
  name: string;
  code: string | null;
  year_from: number;
  year_to: number | null;
  status: Status;
  ai_confidence: number | null;
  generated_by: string | null;
  reviewed_at: string | null;
  summary_sl: string | null;
  summary_en: string | null;
  pros: { sl: string; en: string }[];
  cons: { sl: string; en: string }[];
  ncap_stars: number | null;
  ncap_year: number | null;
  ncap_url: string | null;
  engines: { id: string; name: string; fuel: string; kw: number | null; registrations: number; verdict: string | null; score: number | null; summary_sl: string | null; summary_en: string | null; status: Status }[];
  failures: {
    id: string;
    engine_id: string | null;
    area: string;
    title_sl: string;
    title_en: string;
    body_sl: string | null;
    body_en: string | null;
    likelihood: string;
    cost_min: number | null;
    cost_max: number | null;
    sources: { url: string; title?: string }[];
    ai_check: "supported" | "weak" | "unsupported" | null;
    ai_note: string | null;
    status: Status;
  }[];
  checks: { id: string; text_sl: string; text_en: string; sort: number; status: Status }[];
  links: { id: string; kind: string; label: string; url: string }[];
  reports: Report[];
}

export interface Report {
  id: string;
  generation_id: string | null;
  engine_id: string | null;
  page_url: string | null;
  message: string;
  resolved: boolean;
  created_at: string;
}

export async function reviewGeneration(token: string, id: string): Promise<ReviewGeneration | null> {
  const select = [
    "id,model_id,slug,name,code,year_from,year_to,status,ai_confidence,generated_by,reviewed_at,summary_sl,summary_en,pros,cons,ncap_stars,ncap_year,ncap_url",
    "engines(id,name,fuel,kw,registrations,verdict,score,summary_sl,summary_en,status)",
    "failures(id,engine_id,area,title_sl,title_en,body_sl,body_en,likelihood,cost_min,cost_max,sources,ai_check,ai_note,status)",
    "checks(id,text_sl,text_en,sort,status)",
    "links(id,kind,label,url)",
    "reports(id,generation_id,engine_id,page_url,message,resolved,created_at)",
  ].join(",");
  const [g] = await adminRest<ReviewGeneration[]>(token, `generations?id=eq.${id}&select=${select}`);
  if (!g) return null;
  const check = { unsupported: 0, weak: 1, supported: 2 };
  return {
    ...g,
    engines: [...g.engines].sort((a, b) => b.registrations - a.registrations),
    failures: [...g.failures].sort((a, b) => (check[a.ai_check ?? "supported"] ?? 2) - (check[b.ai_check ?? "supported"] ?? 2)),
    checks: [...g.checks].sort((a, b) => a.sort - b.sort),
    reports: [...g.reports].sort((a, b) => b.created_at.localeCompare(a.created_at)),
  };
}

export async function reportInbox(token: string, all: boolean) {
  return adminRest<(Report & { generations: { id: string; name: string; model_id: string } | null })[]>(
    token,
    `reports?select=id,generation_id,engine_id,page_url,message,resolved,created_at,generations(id,name,model_id)${all ? "" : "&resolved=is.false"}&order=created_at.desc&limit=500`,
  );
}
