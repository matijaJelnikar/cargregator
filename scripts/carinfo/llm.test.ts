import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assertOpencodeModel, extractJson, isUsageLimitError, parseOpencodeEvents } from "./llm.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => resolve(__dirname, "fixtures", name);

async function readFixture(name: string) {
  return await readFile(fixture(name), "utf8");
}

describe("extractJson", () => {
  it("finds a bare JSON object", () => {
    expect(extractJson('hello\n{"answer": "hi"}')).toEqual('{"answer": "hi"}');
  });

  it("finds the last fenced JSON block", () => {
    const text = 'Some prose\n```json\n{"x": 1}\n```\nMore prose\n```\n{"y": 2}\n```';
    expect(extractJson(text)).toEqual('{"y": 2}');
  });

  it("prefers the last object when multiple exist", () => {
    expect(extractJson('{"a": 1}\n{"b": 2}')).toEqual('{"b": 2}');
  });

  it("returns undefined when no JSON is present", () => {
    expect(extractJson("Just plain text")).toBeUndefined();
  });

  it("handles nested braces", () => {
    const nested = '{"outer": {"inner": [1,2,3]}}';
    expect(extractJson(nested)).toEqual(nested);
  });
});

describe("isUsageLimitError", () => {
  it("detects limit-related messages", () => {
    expect(isUsageLimitError("usage limit reached")).toBe(true);
    expect(isUsageLimitError("quota exceeded")).toBe(true);
    expect(isUsageLimitError("rate limit")).toBe(true);
    expect(isUsageLimitError("Go usage limit exceeded")).toBe(true);
    expect(isUsageLimitError("CLI error: You've hit your 5-hour limit · resets 11:40pm (Europe/Ljubljana)")).toBe(true);
    expect(isUsageLimitError("You've hit your weekly limit")).toBe(true);
    expect(isUsageLimitError("insufficient credits")).toBe(true);
  });

  it("ignores unrelated messages", () => {
    expect(isUsageLimitError("validation error")).toBe(false);
    expect(isUsageLimitError("JSON parse error")).toBe(false);
    expect(isUsageLimitError("StatusCode: non 2xx status code (429 GET https://autohub.de/magazin/x)")).toBe(false);
    expect(isUsageLimitError("speed limit 130 km/h")).toBe(false);
    expect(isUsageLimitError("Could not generate a valid report")).toBe(false);
    expect(isUsageLimitError("insufficient engine coverage")).toBe(false);
  });
});

describe("parseOpencodeEvents", () => {
  it("parses a simple success fixture", async () => {
    const raw = await readFixture("opencode-success.jsonl");
    const parsed = parseOpencodeEvents(raw);
    expect(parsed.sessionID).toMatch(/^ses_/);
    expect(parsed.text).toContain('{"answer": "hi"}');
    expect(parsed.error).toBeUndefined();
    expect(parsed.totalCostUsd).toBeGreaterThan(0);
  });

  it("parses a webfetch fixture with a completed tool", async () => {
    const raw = await readFixture("opencode-webfetch.jsonl");
    const parsed = parseOpencodeEvents(raw);
    expect(parsed.text).toContain('{"found": true}');
    expect(parsed.totalCostUsd).toBeGreaterThan(0);
  });

  it("parses a tool error fixture without treating it as fatal", async () => {
    const raw = await readFixture("opencode-websearch-error.jsonl");
    const parsed = parseOpencodeEvents(raw);
    expect(parsed.text).toContain('{"found": true}');
    // The cancelled search is not a usage-limit error, so it should not set error.
    expect(parsed.error).toBeUndefined();
  });

  it("retains evidence of successful headless search and fetch with restricted tools", async () => {
    const raw = await readFixture("opencode-websearch-success.jsonl");
    const events = raw.trim().split("\n").map((line) => JSON.parse(line));
    for (const tool of ["websearch", "webfetch"]) {
      expect(events.some((e) => e.type === "tool_use" && e.part.tool === tool && e.part.state.status === "completed")).toBe(true);
    }
    const parsed = parseOpencodeEvents(raw);
    expect(JSON.parse(parsed.text)).toEqual({ searchWorked: true, fetchWorked: true, shellAvailable: false, editAvailable: false });
    expect(parsed.error).toBeUndefined();
  });


  it("parses a provider error fixture", async () => {
    const raw = '{"type":"error","timestamp":1,"sessionID":"ses_x","error":{"type":"provider.no-route","message":"Model unavailable: opencode-go/nonexistent-model"}}';
    const parsed = parseOpencodeEvents(raw);
    expect(parsed.error).toBe("Model unavailable: opencode-go/nonexistent-model");
  });
});

describe("assertOpencodeModel", () => {
  it("allows any OpenCode Go subscription model", () => {
    for (const m of ["opencode-go/kimi-k2.7-code", "opencode-go/minimax-m3", "opencode-go/gpt-5.6-luna", "opencode-go/glm-5.3"])
      expect(() => assertOpencodeModel(m)).not.toThrow();
    for (const m of ["kimi-k2.7-code", "opencode/grok-code-free", "anthropic/claude-sonnet-5-5", "opencode-go/"])
      expect(() => assertOpencodeModel(m)).toThrow(/not allowed/);
  });
});
