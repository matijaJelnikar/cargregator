import { describe, expect, it } from "vitest";
import { renderProgress, stateOf, type Row } from "./progress";

const none = { answer: false, checked: false, exported: false, held: false, error: false };

describe("pipeline state of a generation", () => {
  it("is the furthest step reached", () => {
    expect(stateOf(none)).toBe("todo");
    expect(stateOf({ ...none, error: true })).toBe("failed");
    expect(stateOf({ ...none, answer: true, error: true })).toBe("written");
    expect(stateOf({ ...none, answer: true, checked: true })).toBe("checked");
    expect(stateOf({ ...none, answer: true, checked: true, held: true })).toBe("held");
    expect(stateOf({ ...none, answer: true, checked: true, exported: true })).toBe("exported");
  });
});

describe("progress file", () => {
  const row = (rank: number, state: Row["state"], by = ""): Row => ({ rank, id: String(rank), label: `Car ${rank}`, registrations: 1000 - rank, state, by });
  const md = renderProgress([row(1, "exported", "claude/sonnet"), row(2, "todo"), row(3, "failed", ""), row(4, "todo")], new Date("2026-10-24T12:00:00Z"));

  it("counts every state against the total", () => {
    expect(md).toContain("| not started | 2 |");
    expect(md).toContain("| **total** | **4** |");
    expect(md).toContain("Written by: claude/sonnet 1.");
  });

  it("lists what is next in rank order", () => {
    const next = md.slice(md.indexOf("## Next up"), md.indexOf("## Failed"));
    expect(next.indexOf("Car 2")).toBeLessThan(next.indexOf("Car 4"));
    expect(next).not.toContain("Car 1");
  });
});
