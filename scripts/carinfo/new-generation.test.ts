import { describe, expect, it } from "vitest";
import { newGenerationSql } from "./new-generation.ts";

const text = { sl: "Besedilo", en: "Text" };
const item = { ...text, short: text };
const skeleton = {
  model_id: "subaru-legacy", slug: "bl-bp", aliases: ["bl", "bp"], name: "Legacy IV", code: "BL/BP",
  year_from: 2003, year_to: 2009,
  engines: [{ name: "2.0R", engine_code: null, fuel: "petrol", kw: 121, ccm: 1994, year_from: 2005, year_to: 2007 }],
};
const answer = {
  summary: text, pros: [item, item], cons: [item, item],
  engines: [{ name: "2.0R", verdict: "ok", score: 7, annual_cost_min: null, annual_cost_max: null, summary: text }],
  failures: [{ area: "engine", engine: "2.0R", title: text, body: text, symptoms: text, year_from: null, year_to: null,
    likelihood: "low", cost_min: null, cost_max: null, sources: [{ url: "https://example.com/evidence", title: "Source" }] }],
  checks: [text, text, text], links: [], ncap: null, confidence: 0.5,
};
const checked = { failures: [{ index: 0, check: "supported", note: "Source checked" }], bad_urls: [], errors: [], unsourced: [] };
const exportSql = (s = skeleton, a = answer, c: unknown = checked) => newGenerationSql(s, a, c, "codex/test");

describe("missing-generation export validation", () => {
  it("refuses unassessed engines and unknown failure engine references", () => {
    expect(() => exportSql(skeleton, { ...answer, engines: [] })).toThrow(/Missing assessment/);
    expect(() => exportSql(skeleton, { ...answer, failures: [{ ...answer.failures[0], engine: "2.5i" }] })).toThrow(/Unknown failure engine/);
  });
  it("requires a complete, unambiguous check rather than defaulting missing evidence to supported", () => {
    expect(() => exportSql(skeleton, answer, { ...checked, failures: [] })).toThrow(/exactly one check/);
    expect(() => exportSql(skeleton, answer, { ...checked, failures: [{ ...checked.failures[0], index: 4 }] })).toThrow(/exactly one check/);
    expect(() => exportSql(skeleton, answer, { ...checked, errors: [{ claim: "wrong", fix: "correct" }] })).toThrow(/Resolve prose errors/);
  });
  it("rejects held-back reports, removed sources and missing short labels", () => {
    expect(() => exportSql(skeleton, answer, { ...checked, failures: [{ ...checked.failures[0], check: "unsupported" }] })).toThrow(/held back/);
    expect(() => exportSql(skeleton, answer, { ...checked, http: { "https://example.com/evidence": 404 } })).toThrow(/no publishable failure evidence/);
    expect(() => exportSql(skeleton, { ...answer, pros: [text, text] } as typeof answer)).toThrow(/short labels/);
  });
  it("rejects duplicate variants and engine years outside their generation", () => {
    expect(() => exportSql({ ...skeleton, engines: [...skeleton.engines, ...skeleton.engines] })).toThrow(/Duplicate engine variant/);
    expect(() => exportSql({ ...skeleton, engines: [{ ...skeleton.engines[0], year_to: 2015 }] })).toThrow(/Invalid engine years/);
  });
});
