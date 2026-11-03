import { describe, expect, it } from "vitest";
import { buildAdditionBatch } from "./addition-batch.ts";
const text = { sl: "Besedilo", en: "Text" };
const item = { ...text, short: text };
const skeleton = {
  model_id: "subaru-legacy", slug: "bl-bp", aliases: ["bl", "bp"], name: "Legacy IV", code: "BL/BP",
  year_from: 2003, year_to: 2009,
  engines: [{ name: "2.0R", engine_code: null, fuel: "petrol", kw: 121, ccm: 1994, year_from: 2005, year_to: 2007 }],
};
const answer = {
  generated_by: "codex/direct-source-test", summary: text, pros: [item, item], cons: [item, item],
  engines: [{ name: "2.0R", verdict: "ok", score: 7, annual_cost_min: null, annual_cost_max: null, summary: text }],
  failures: [{ area: "engine", engine: "2.0R", title: text, body: text, symptoms: text, year_from: null, year_to: null,
    likelihood: "low", cost_min: null, cost_max: null, sources: [{ url: "https://example.com/evidence", title: "Source" }] }],
  checks: [text, text, text], links: [], ncap: null, confidence: 0.5,
};
const checked = { failures: [{ index: 0, check: "supported", note: "Source checked" }], bad_urls: [], errors: [], unsourced: [] };

const input = { skeleton, answer, checked };
describe("direct-source addition batches", () => {
  it("exports one transaction for multiple additions", () => {
    const second = { ...input, skeleton: { ...skeleton, slug: "test-next", code: "NEXT", aliases: [] } };
    const result = buildAdditionBatch([input, second], []);
    expect(result.included).toEqual(["subaru-legacy/bl-bp", "subaru-legacy/test-next"]);
    expect(result.sql.match(/^begin;$/gm)).toHaveLength(1);
    expect(result.sql.match(/^commit;$/gm)).toHaveLength(1);
    expect(result.sha256).toMatch(/^[a-f0-9]{64}$/);
  });
  it("skips existing exact targets while refusing alternate-slug duplicates", () => {
    const second = { ...input, skeleton: { ...skeleton, slug: "test-next", code: "NEXT", aliases: [] } };
    const result = buildAdditionBatch([input, second], [{ model_id: skeleton.model_id, slug: skeleton.slug }]);
    expect(result.skipped).toEqual(["subaru-legacy/bl-bp"]);
    expect(result.included).toEqual(["subaru-legacy/test-next"]);
    expect(() => buildAdditionBatch([input], [{ model_id: skeleton.model_id, slug: "bp" }])).toThrow(/alias/);
    expect(() => buildAdditionBatch([input], [{ model_id: skeleton.model_id, slug: "other", code: "bl\/bp" }])).toThrow(/alias/);
  });
  it("refuses duplicate targets, unknown taxonomy and non-direct provenance", () => {
    expect(() => buildAdditionBatch([input, input], [])).toThrow(/Duplicate batch target/);
    expect(() => buildAdditionBatch([{ ...input, skeleton: { ...skeleton, model_id: "subaru-nonexistent" } }], [])).toThrow(/taxonomy/);
    expect(() => buildAdditionBatch([{ ...input, answer: { ...answer, generated_by: "other" } }], [])).toThrow(/provenance/);
    expect(() => buildAdditionBatch([input], [{ model_id: skeleton.model_id, slug: skeleton.slug }])).toThrow(/No absent/);
  });
});
