import { describe, expect, it } from "vitest";
import { ReportAnswer, type VerifyAnswer } from "../../src/lib/carinfo";
import { batchStamp, checkConfidence, coverageLine, generationSql, isHeld, needsExport, spaceNumbers } from "./import";

const t = (en: string) => ({ sl: `${en} (sl)`, en });
const failure = (title: string, url: string) => ({
  area: "engine" as const,
  engine: null,
  title: t(title),
  body: t("body"),
  symptoms: t("symptoms"),
  year_from: 2012,
  year_to: 2015,
  likelihood: "med" as const,
  cost_min: 100,
  cost_max: 900,
  sources: [{ url, title: "src" }],
});
const answer = ReportAnswer.parse({
  summary: t("Summary with O'Brien"),
  pros: [t("a"), t("b")],
  cons: [t("c"), t("d")],
  engines: [{ name: "1.4 TSI", verdict: "ok", score: 7, annual_cost_min: 400, annual_cost_max: 900, summary: t("fine") }],
  failures: [failure("Kept", "https://ok.example/a"), failure("Unsupported", "https://ok.example/b"), failure("Dead source", "https://dead.example/c")],
  checks: [t("one"), t("two"), t("three")],
  links: [
    { kind: "test", title: "Test", url: "https://ok.example/test" },
    { kind: "review", title: "Wrong car", url: "https://ok.example/wrong" },
    { kind: "test", title: "Plain http", url: "http://ok.example/plain" },
  ],
  ncap: { stars: 5, year: 2012, url: "https://ok.example/ncap" },
  confidence: 0.6,
});
const verify: VerifyAnswer & { http: Record<string, number> } = {
  failures: [
    { index: 0, check: "supported", note: "" },
    { index: 1, check: "unsupported", note: "" },
    { index: 2, check: "weak", note: "" },
  ],
  bad_urls: ["https://ok.example/wrong"],
  errors: [],
  unsourced: [],
  http: { "https://dead.example/c": 404 },
};

describe("importing a checked report", () => {
  const g = generationSql("00000000-0000-0000-0000-000000000001", answer, verify, "test");

  it("keeps supported failures and drops unsupported ones and ones whose only source is dead", () => {
    expect(g.kept).toBe(1);
    expect(g.dropped).toBe(2);
    expect(g.sql).toContain('"en":"Kept"');
    expect(g.sql).not.toContain('"en":"Unsupported"');
    expect(g.sql).not.toContain('"en":"Dead source"');
  });

  it("drops links the checker flagged and keeps the NCAP rating", () => {
    expect(g.links).toBe(1);
    expect(g.sql).not.toContain("ok.example/wrong");
    expect(g.sql).not.toContain("ok.example/plain");
    expect(g.sql).toContain('"ncap":{"stars":5');
  });

  it("escapes quotes for the SQL literal", () => {
    expect(g.sql).toContain("O''Brien");
    expect(g.sql.startsWith("select * from carinfo.load_report(")).toBe(true);
  });
});

describe("choosing what to export", () => {
  it("holds back a report when more than half its failures are unsupported", () => {
    expect(isHeld(4, 6)).toBe(true);
    expect(isHeld(3, 6)).toBe(false);
    expect(isHeld(0, 0)).toBe(false);
  });

  it("exports reports never exported or checked again since", () => {
    expect(needsExport(1000, undefined)).toBe(true);
    expect(needsExport(2000, 1000)).toBe(true);
    expect(needsExport(1000, 1000)).toBe(false);
  });

  it("states coverage against all generations", () => {
    const line = coverageLine({ total: 818, written: 300, checked: 250, exported: 40, held: 2, previously: 208 });
    expect(line).toContain("300 of 818 generations written, 250 checked");
    expect(line).toContain("exported 40 and held back 2");
  });

  it("names batches so they sort by time", () => {
    expect(batchStamp(new Date("2026-10-24T14:31:59Z"))).toBe("20261024-1431");
  });
});

describe("spaceNumbers", () => {
  it("puts back the space a model dropped before a number", () => {
    expect(spaceNumbers("motor je razvil200 kW, either120 or kot2.4")).toBe("motor je razvil 200 kW, either 120 or kot 2.4");
  });
  it("leaves names and units alone", () => {
    expect(spaceNumbers("Mazda5, Euro6, Hybrid4, AutoScout24, 1.4 TSI, 2KD-FTV")).toBe("Mazda5, Euro6, Hybrid4, AutoScout24, 1.4 TSI, 2KD-FTV");
  });
});

describe("checkConfidence", () => {
  const check = (...c: VerifyAnswer["failures"][number]["check"][]) => c.map((check, index) => ({ index, check, note: "" }));
  const sites = (n: number) => Array.from({ length: n }, (_, i) => `https://www.site${i}.example/page`);

  it("is high only when failures are supported by several sites", () => {
    expect(checkConfidence({ failures: check("supported", "supported"), errors: [] }, 2, sites(4))).toBe(1);
    expect(checkConfidence({ failures: check("supported", "supported"), errors: [] }, 2, sites(2))).toBe(0.85);
  });

  it("counts weak as half, unsupported and skipped as nothing and weak", () => {
    expect(checkConfidence({ failures: check("weak", "unsupported"), errors: [] }, 2, sites(4))).toBe(0.48);
    expect(checkConfidence({ failures: check("supported"), errors: [] }, 2, sites(4))).toBe(0.83);
  });

  it("subtracts fixed prose errors and counts one site once", () => {
    const errors = [{ claim: "a", fix: "b" }, { claim: "c", fix: "d" }];
    expect(checkConfidence({ failures: check("supported"), errors }, 1, ["https://a.example/1", "https://www.a.example/2"])).toBe(0.68);
  });
});
