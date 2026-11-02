import { describe, expect, it } from "vitest";
import { matchReportEngines, resolveEngineName } from "./engine-names";
import { ReportAnswer } from "../../src/lib/carinfo";
import { engineNames, type DbGen } from "./report";
import { generationSql } from "./import";
const engines = [
  { name: "3.0 V6 TDI", engine_code: "EA897" },
  { name: "2.0 TSI", engine_code: "EA888" },
  { name: "2.0 TSI", engine_code: "EA113" },
  { name: "2.0 TSI 4MOTION", engine_code: "EA888" },
];
const text = { sl: "Besedilo", en: "Text" };
const report = ReportAnswer.parse({
  summary: text, pros: [text, text], cons: [text, text], engines: [],
  failures: [], checks: [text, text, text], links: [], ncap: null, confidence: 0.5,
});
const assessment = (name: string) => ({ name, verdict: "recommended" as const, score: 8, annual_cost_min: 900, annual_cost_max: 2200, summary: text });

describe("conservative report engine matching", () => {
  it("resolves Touareg code suffixes to the exact stored name", () => {
    expect(resolveEngineName("3.0 V6 TDI (EA897)", engines)).toBe("3.0 V6 TDI");
  });
  it("keeps canonical names and harmless case/spacing", () => {
    expect(resolveEngineName("3.0 V6 TDI", engines)).toBe("3.0 V6 TDI");
    expect(resolveEngineName(" electric ", [{ name: "Electric" }])).toBe("Electric");
  });
  it("requires all family codes and never strips drivetrain qualifiers", () => {
    expect(resolveEngineName("2.0 TSI (EA113/EA888)", engines)).toBe("2.0 TSI");
    expect(resolveEngineName("2.0 TSI (EA888)", engines)).toBeUndefined();
    expect(resolveEngineName("3.0 V6 TDI (EA898)", engines)).toBeUndefined();
    expect(resolveEngineName("3.0 V6 TDI (4MOTION)", engines)).toBeUndefined();
    expect(resolveEngineName("2.0 TSI 4MOTION", engines)).toBe("2.0 TSI 4MOTION");
  });
  it("refuses ambiguous normalisation and unknown-code suffixes", () => {
    expect(resolveEngineName("ELECTRIC", [{ name: "Electric" }, { name: "electric" }])).toBeUndefined();
    expect(resolveEngineName("Electric (motor)", [{ name: "Electric" }])).toBeUndefined();
  });
  it("preserves case-sensitive model distinctions and tolerates unspecified variant codes", () => {
    const list = [{ name: "2.0t", engine_code: "B207" }, { name: "2.0T", engine_code: "B207" }];
    expect(resolveEngineName("2.0t (B207)", list)).toBe("2.0t");
    expect(resolveEngineName("2.0T (B207)", list)).toBe("2.0T");
    expect(resolveEngineName("3.0 V6 TDI (EA897)", [...engines, { name: "3.0 V6 TDI", engine_code: null }])).toBe("3.0 V6 TDI");
  });
  it("scopes manually reviewed typos to their generation", () => {
    const list = [{ name: "1.4 TFSI e", engine_code: "EA211" }];
    expect(resolveEngineName("1.4 TFSe e (EA211)", list, "audi-q3/f3")).toBe("1.4 TFSI e");
    expect(resolveEngineName("1.4 TFSe e (EA211)", list, "other")).toBeUndefined();
  });
  it("reports missing and duplicate assessments instead of silently exporting", () => {
    const result = matchReportEngines({ ...report, engines: [assessment("3.0 V6 TDI"), assessment("3.0 V6 TDI (EA897)")] }, engines);
    expect(result.issues).toContain("Duplicate assessment: 3.0 V6 TDI");
    expect(result.missing).toContain("2.0 TSI");
    expect(() => generationSql("id", report, { failures: [], bad_urls: [], errors: [], unsourced: [] }, "test", "", engines)).toThrow(/Missing assessment/);
  });
  it("does not turn an unknown failure engine into a generation-wide problem", () => {
    const result = matchReportEngines({ ...report, failures: [{
      engine: "unknown diesel", area: "engine", title: text, body: text, symptoms: text,
      year_from: null, year_to: null, likelihood: "med", cost_min: null, cost_max: null,
      sources: [{ url: "https://example.com", title: "Source" }],
    }] }, []);
    expect(result.issues).toContain("Unknown failure engine: unknown diesel");
    expect(result.answer.failures[0].engine).toBe("unknown diesel");
  });
});

describe("report prompt engine keys", () => {
  it("quotes canonical names separately from the code metadata", () => {
    const gen = { year_from: 2018, year_to: 2024, engines: [
      { name: "3.0 V6 TDI", engine_code: "EA897", fuel: "diesel", kw: 210, year_from: 2018, year_to: 2024 },
    ] } as DbGen;
    expect(engineNames(gen)[0]).toMatchObject({
      name: "3.0 V6 TDI",
      line: expect.stringContaining('name: "3.0 V6 TDI"; codes: EA897;'),
    });
  });
});
