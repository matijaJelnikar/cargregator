import { describe, expect, it } from "vitest";
import { engineShortlist, priorityRisks, summaryPreview } from "./buyingGuide";
import type { CarEngine, CarFailure } from "./carinfoDb";

const engine = (id: string, verdict: CarEngine["verdict"], score: number, name = id): CarEngine => ({
  id, name, slug: id, verdict, score, registrations: 100, fuel: "petrol", kw: 100,
  engine_code: null, ccm: null, year_from: 2010, year_to: 2015,
  annual_cost_min: null, annual_cost_max: null, summary_sl: null, summary_en: null,
});

describe("buying guide engine choices", () => {
  it("keeps good choices separate from issues even when an issue engine scores higher", () => {
    const result = engineShortlist([engine("bad", "issues", 10), engine("fine", "ok", 8), engine("best", "recommended", 7), engine("avoid", "avoid", 2)]);
    expect(result.choices.map((e) => e.id)).toEqual(["best", "fine"]);
    expect(result.caution.map((e) => e.id)).toEqual(["avoid"]);
  });
  it("preserves exact variants when one name has conflicting verdicts", () => {
    const result = engineShortlist([engine("early", "avoid", 3, "1.4 TSI"), engine("late", "recommended", 9, "1.4 TSI"), engine("other", "recommended", 8)]);
    expect(result.choices.map((e) => e.id)).toEqual(["late", "other"]);
    expect(result.caution[0].id).toBe("early");
  });
  it("does not invent recommendations for unknown or problematic engines", () => {
    expect(engineShortlist([engine("unknown", null, 10), engine("bad", "issues", 5)]).choices).toEqual([]);
    expect(engineShortlist([])).toEqual({ choices: [], caution: [] });
  });
  it("deduplicates names within a shortlist without mutating source order", () => {
    const engines = [engine("a", "recommended", 8, "2.0 TDI"), engine("b", "recommended", 9, "2.0 TDI"), engine("c", "ok", 7)];
    expect(engineShortlist(engines).choices.map((e) => e.id)).toEqual(["b", "c"]);
    expect(engines.map((e) => e.id)).toEqual(["a", "b", "c"]);
  });
});

describe("overview excerpt", () => {
  it("keeps decimal engine codes and exposes the remaining text verbatim", () => {
    const text = "The 1.9 TDI is economical. It suits long journeys. Check the service history.";
    expect(summaryPreview(text, "en")).toEqual({ lead: "The 1.9 TDI is economical. It suits long journeys.", rest: "Check the service history." });
  });
  it("handles short, empty and Slovenian summaries", () => {
    expect(summaryPreview("", "sl")).toEqual({ lead: "", rest: "" });
    expect(summaryPreview("Dobra izbira.", "sl")).toEqual({ lead: "Dobra izbira.", rest: "" });
    expect(summaryPreview("Motor 1.6 HDi je varčen. Primeren je za daljše poti. Preverite jermen.", "sl").rest).toBe("Preverite jermen.");
  });
});

describe("priority ownership risks", () => {
  it("selects three by likelihood and cost while preserving the source", () => {
    const failures = [
      { id: "cheap", likelihood: "high", cost_max: 100 },
      { id: "costly", likelihood: "high", cost_max: 2000 },
      { id: "medium", likelihood: "med", cost_max: 1500 },
      { id: "unknown", likelihood: "low", cost_max: null },
    ] as CarFailure[];
    expect(priorityRisks(failures).map((f) => f.id)).toEqual(["costly", "medium", "unknown"]);
    expect(failures[0].id).toBe("cheap");
  });
});