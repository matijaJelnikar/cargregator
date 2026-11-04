import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReportAnswer, type VerifyAnswer } from "../../src/lib/carinfo.ts";
import { ask } from "./llm.ts";
import { fix } from "./verify.ts";

vi.mock("./llm.ts", async (importOriginal) => ({
  ...await importOriginal<typeof import("./llm.ts")>(),
  ask: vi.fn(),
}));

const text = (en: string) => ({ sl: en, en });
const answer = ReportAnswer.parse({
  summary: text("Original summary"),
  pros: ["First pro", "Second pro"].map((en) => ({ ...text(en), short: text("Old label") })),
  cons: ["First con", "Second con"].map((en) => ({ ...text(en), short: text("Old label") })),
  engines: [{ name: "1.4 TSI", verdict: "ok", score: 7, annual_cost_min: null, annual_cost_max: null, summary: text("Engine") }],
  failures: [], checks: [text("One"), text("Two"), text("Three")], links: [], ncap: null, confidence: 0.5,
});
const check: VerifyAnswer = { failures: [], bad_urls: [], errors: [{ claim: "Original summary", fix: "Corrected summary" }], unsourced: [] };
const dirs: string[] = [];

afterEach(async () => {
  vi.resetAllMocks();
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("corrections in an isolated report output directory", () => {
  it("saves corrections and preserves the original in the selected directory, keeping engine identity and clearing stale labels", async () => {
    const dir = await mkdtemp(join(tmpdir(), "carinfo-verify-"));
    dirs.push(dir);
    const raw = { model_id: "test-model", slug: "mk1", runner: "claude", ...answer };
    await writeFile(join(dir, "test-id.json"), JSON.stringify(raw));
    vi.mocked(ask).mockResolvedValue({ structured_output: {
      ...answer, summary: text("Corrected summary"),
      engines: [{ ...answer.engines[0], name: "Invented replacement name" }],
    } });

    await fix("test-id", raw, answer, check, dir);
    const saved = JSON.parse(await readFile(join(dir, "test-id.json"), "utf8"));
    expect(saved.summary.en).toBe("Corrected summary");
    expect(saved.engines[0].name).toBe("1.4 TSI");
    expect(saved.pros.every((p: { short?: unknown }) => p.short === undefined)).toBe(true);
    expect(saved.cons.every((p: { short?: unknown }) => p.short === undefined)).toBe(true);
    expect(saved.model_id).toBe("test-model");
    expect(JSON.parse(await readFile(join(dir, "test-id.orig.json"), "utf8"))).toEqual(raw);

    await fix("test-id", { ...raw, summary: text("Later revision") }, answer, check, dir);
    expect(JSON.parse(await readFile(join(dir, "test-id.orig.json"), "utf8"))).toEqual(raw);
  });

  it("leaves the answer intact when the correction cannot be validated", async () => {
    const dir = await mkdtemp(join(tmpdir(), "carinfo-verify-"));
    dirs.push(dir);
    const original = JSON.stringify(answer);
    await writeFile(join(dir, "test-id.json"), original);
    vi.mocked(ask).mockResolvedValue({ structured_output: { summary: text("Incomplete correction") } });
    await expect(fix("test-id", answer, answer, check, dir)).rejects.toThrow("fix:");
    expect(await readFile(join(dir, "test-id.json"), "utf8")).toBe(original);
    await expect(readFile(join(dir, "test-id.orig.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});
