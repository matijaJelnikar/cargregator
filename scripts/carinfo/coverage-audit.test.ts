import { describe, expect, it } from "vitest";
import { auditCoverage, type CatalogueGeneration, type CoverageCandidate } from "./coverage-audit.ts";

const generation = (slug: string, status = "ai_checked"): CatalogueGeneration => ({
  model_id: "subaru-legacy", slug, name: "Legacy", year_from: 2003, year_to: 2009, status,
});
const candidate: CoverageCandidate = { model_id: "subaru-legacy", slug: "bl-bp", name: "Legacy IV", year_from: 2003, year_to: 2009, research: "pilot-sourced" };
const taxonomy = new Set([candidate.model_id]);

describe("catalogue coverage audit", () => {
  it("separates absent generations from absent model taxonomy", () => {
    const result = auditCoverage([generation("bm")], [candidate, { ...candidate, model_id: "subaru-tribeca", slug: null }], taxonomy);
    expect(result.map((r) => r.state)).toEqual(["missing-generation", "missing-model"]);
  });
  it("does not treat an existing held-back or hidden generation as a missing car", () => {
    for (const status of ["skeleton", "hidden", "reviewed", "ai_checked"]) {
      expect(auditCoverage([generation("bl-bp", status)], [candidate], taxonomy)[0].state).toBe("present");
    }
  });
  it("recognises explicit aliases without assuming overlapping production years prove identity", () => {
    expect(auditCoverage([generation("bp")], [{ ...candidate, aliases: ["bl", "bp"] }], taxonomy)[0].state).toBe("present");
    expect(auditCoverage([generation("bm")], [candidate], taxonomy)[0].state).toBe("missing-generation");
  });
});
