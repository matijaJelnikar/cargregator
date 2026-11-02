import { describe, expect, it } from "vitest";
import { auditLinks, checkLink, hideFailureSql, sourceState, sourceUrl, SourceFailures, type LinkResult, type SourceFailure } from "./check-links";

const failure: SourceFailure = {
  id: "00000000-0000-4000-8000-000000000001", generation_id: "00000000-0000-4000-8000-000000000002",
  status: "ai_checked", title_sl: "Težava", title_en: "Owner's issue", body_sl: null, body_en: "Description",
  updated_at: "2026-11-01T00:00:00Z",
  sources: [{ url: "https://example.com/source#section", title: "Source" }], generations: { status: "ai_checked" },
};
const result = (url: string, state: LinkResult["state"]): LinkResult => ({ url, state, statuses: state === "dead" ? [404, 410] : [200], checked_at: "2026-11-02T20:00:00Z" });
function fetchStatuses(...statuses: number[]): typeof fetch {
  return (async () => {
    const status = statuses.shift();
    if (status == null) throw new Error("Unexpected request");
    return new Response(null, { status });
  }) as typeof fetch;
}

describe("source URL identity", () => {
  it("deduplicates fragments but preserves query strings", () => {
    expect(sourceUrl("https://example.com/source?q=1#part")).toBe("https://example.com/source?q=1");
    expect(sourceUrl("https://example.com/source?q=2")).not.toBe(sourceUrl("https://example.com/source?q=1"));
  });
  it.each(["garbage", "mailto:a@example.com", "file:///etc/hosts", "https://user:secret@example.com"])("rejects unsupported URL %s", (url) => {
    expect(sourceUrl(url)).toBeNull();
  });
});

describe("source checks", () => {
  it("requires two definite gone responses", async () => {
    expect(await checkLink("https://example.com/", 1000, fetchStatuses(404, 410))).toMatchObject({ state: "dead", statuses: [404, 410] });
  });
  it("accepts a successful confirmation after an initial 404", async () => {
    expect(await checkLink("https://example.com/", 1000, fetchStatuses(404, 200))).toMatchObject({ state: "live", statuses: [404, 200] });
  });
  it.each([202, 204, 205, 401, 403, 429, 500, 503])("keeps HTTP %i unknown", async (status) => {
    expect(await checkLink("https://example.com/", 1000, fetchStatuses(status))).toMatchObject({ state: "unknown", statuses: [status] });
  });
  it("does not treat failed confirmation as dead", async () => {
    expect(await checkLink("https://example.com/", 1000, fetchStatuses(404))).toMatchObject({ state: "unknown", statuses: [404], error: "Unexpected request" });
  });
});

describe("guarded source cleanup", () => {
  const dead = new Map([["https://example.com/source", result("https://example.com/source", "dead")]]);
  it("requires complete snapshot identity and timestamps before preparing SQL", () => {
    expect(SourceFailures.parse([failure])).toEqual([failure]);
    expect(SourceFailures.safeParse([{ ...failure, updated_at: undefined }]).success).toBe(false);
    expect(SourceFailures.safeParse([{ ...failure, id: "invalid" }]).success).toBe(false);
    expect(SourceFailures.safeParse([{ ...failure, generations: null }]).success).toBe(false);
  });
  it("generates guarded SQL only for a failure whose every source is confirmed dead", () => {
    const sql = hideFailureSql(failure, dead)!;
    expect(sql).toContain("set status = 'hidden'");
    expect(sql).toContain("Owner''s issue");
    expect(sql).toContain("f.body_sl is not distinct from null");
    expect(sql).toContain("f.sources = '");
    expect(sql).toContain("g.status = 'ai_checked'");
    expect(sql).toContain("f.status = 'ai_checked'");
    expect(sql).toContain("f.updated_at = '2026-11-01T00:00:00Z'::timestamptz");
  });
  it("preserves failures with any live or unchecked source", () => {
    const extra = { ...failure, sources: [...failure.sources, { url: "https://example.com/other", title: "Other" }] };
    expect(sourceState(extra, dead)).toBe("unknown");
    expect(hideFailureSql(extra, dead)).toBeNull();
    const mixed = new Map([...dead, ["https://example.com/other", result("https://example.com/other", "live")] as const]);
    expect(sourceState(extra, mixed)).toBe("live");
    expect(hideFailureSql(extra, mixed)).toBeNull();
  });
  it("does not use empty source lists as evidence", () => {
    expect(sourceState({ ...failure, sources: [] }, dead)).toBe("unknown");
    expect(hideFailureSql({ ...failure, sources: [] }, dead)).toBeNull();
  });
  it.each(["reviewed", "hidden", "generated"])("protects %s failure or parent", (status) => {
    expect(hideFailureSql({ ...failure, status }, dead)).toBeNull();
    expect(hideFailureSql({ ...failure, generations: { status } }, dead)).toBeNull();
  });
});

describe("bounded source audit", () => {
  it("checks each URL once, preserves order and limits concurrent requests", async () => {
    let running = 0; let peak = 0;
    const urls = ["a", "b", "c", "d", "e"];
    const checked = await auditLinks(urls, 2, async (url) => {
      peak = Math.max(peak, ++running);
      await new Promise((resolve) => setTimeout(resolve, 1));
      running--;
      return result(url, "live");
    });
    expect(checked.map((r) => r.url)).toEqual(urls);
    expect(peak).toBe(2);
  });
  it("handles an empty list without calling the checker", async () => {
    expect(await auditLinks([], 4, async () => { throw new Error("unexpected"); })).toEqual([]);
  });
  it("rejects invalid concurrency", async () => {
    await expect(auditLinks([], 0, async () => result("", "unknown"))).rejects.toThrow("positive integer");
  });
});
