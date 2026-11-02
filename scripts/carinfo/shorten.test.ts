import { describe, expect, it } from "vitest";
import { ReportAnswer } from "../../src/lib/carinfo";
import { applyShorts, needsShorten, ShortenBatch, shortenPrompt, shortsSql } from "./shorten";

const t = (en: string) => ({ sl: `${en} (sl)`, en });
type Label = { sl: string; en: string };
const labels = (n: number, prefix = "Label"): Label[] =>
  Array.from({ length: n }, (_, i) => ({ sl: `${prefix} ${i}`, en: `${prefix} ${i}` }));
const report = (pros = 2, cons = 2) =>
  ReportAnswer.parse({
    summary: t("Summary"),
    pros: Array.from({ length: pros }, (_, i) => t(`pros ${i}`)),
    cons: Array.from({ length: cons }, (_, i) => t(`cons ${i}`)),
    engines: [],
    failures: [],
    checks: [t("one"), t("two"), t("three")],
    links: [],
    ncap: null,
    confidence: 0.5,
  });

describe("applying short labels", () => {
  it("sets one label per pro and con and keeps the sentences", () => {
    const a = report(3, 2);
    const b = applyShorts(a, { pros: labels(3, "P"), cons: labels(2, "C") });
    expect(b.pros.map((p) => p.short?.en)).toEqual(["P 0", "P 1", "P 2"]);
    expect(b.cons.map((c) => c.short?.en)).toEqual(["C 0", "C 1"]);
    expect(b.pros.map((p) => p.en)).toEqual(a.pros.map((p) => p.en));
  });

  it("throws when the label counts do not match", () => {
    const a = report(3, 2);
    expect(() => applyShorts(a, { pros: labels(2), cons: labels(2) })).toThrow(/pros/);
    expect(() => applyShorts(a, { pros: labels(3), cons: labels(1) })).toThrow(/cons/);
  });
});

describe("needsShorten", () => {
  it("is true until every pro and con has a valid label", () => {
    expect(needsShorten(report())).toBe(true);
    expect(needsShorten(applyShorts(report(), { pros: labels(2), cons: labels(2) }))).toBe(false);
  });
});

describe("ShortenBatch", () => {
  const batch = (label: string) => ({
    reports: [{ id: "a", pros: [{ sl: label, en: label }], cons: [{ sl: label, en: label }] }],
  });

  it("accepts labels up to 32 characters and rejects longer ones", () => {
    expect(ShortenBatch.safeParse(batch("x".repeat(32))).success).toBe(true);
    expect(ShortenBatch.safeParse(batch("x".repeat(33))).success).toBe(false);
  });
});

describe("shortsSql", () => {
  const labelled = applyShorts(report(2, 2), {
    pros: [{ sl: "O'Brien", en: "O'Brien" }, ...labels(1)],
    cons: labels(2),
  });
  const sql = shortsSql("00000000-0000-0000-0000-000000000001", labelled);

  it("writes the cleaned labels and escapes quotes", () => {
    expect(sql).toContain("update carinfo.generations set pros = ");
    expect(sql).toContain('"short":{"sl":"O\'\'Brien"');
    expect(sql).toContain("O''Brien");
  });

  it("guards the update on the stored sentences without labels", () => {
    expect(sql).toContain("where id = '00000000-0000-0000-0000-000000000001'::uuid");
    expect(sql).toContain("jsonb_agg(x - 'short')");
    expect(sql).toContain("from jsonb_array_elements(pros) x) = ");
    expect(sql.match(/"short"/g)).toHaveLength(4);
    expect(sql.match(/O''Brien/g)).toHaveLength(2);
  });

  it("cleans the labels the same way import.ts cleans the sentences", () => {
    const withSpacing = applyShorts(report(2, 2), {
      pros: [{ sl: "motor1", en: "engine1" }, ...labels(1)],
      cons: labels(2),
    });
    expect(shortsSql("00000000-0000-0000-0000-000000000001", withSpacing)).toContain(
      '"short":{"sl":"motor 1","en":"engine 1"}',
    );
  });

  it("keeps evo2 intact in labels and in the stored-sentence guard", () => {
    const withCode = structuredClone(labelled);
    withCode.pros[0] = { sl: "Motor EA211 evo2", en: "EA211 evo2 engine", short: { sl: "EA211 evo2", en: "EA211 evo2" } };
    const sql = shortsSql("00000000-0000-0000-0000-000000000001", withCode);
    expect(sql).toContain('"sl":"Motor EA211 evo2","en":"EA211 evo2 engine"');
    expect(sql).toContain('"short":{"sl":"EA211 evo2","en":"EA211 evo2"}');
    expect(sql).not.toContain("evo 2");
  });
});

describe("shortenPrompt", () => {
  const prompt = shortenPrompt([
    { id: "id-a", name: "Golf VII", pros: [{ sl: "a", en: "A" }], cons: [{ sl: "c", en: "C" }] },
    { id: "id-b", name: "Octavia III", pros: [{ sl: "b", en: "B" }], cons: [{ sl: "d", en: "D" }] },
  ]);

  it("includes every report id", () => {
    expect(prompt).toContain("id-a");
    expect(prompt).toContain("id-b");
  });

  it("states the label rules", () => {
    expect(prompt).toContain("2–4 words, at most 32 characters");
    expect(prompt).toContain('"N16 timing chain", not "Engine issues"');
    expect(prompt).toContain('"Sliding rear bench", not "Practical"');
    expect(prompt).toContain("Keep model/engine/part codes exactly as written");
    expect(prompt).toContain("Write the Slovenian label natively");
    expect(prompt).toContain("Say only what the sentence says; add nothing.");
  });
});
