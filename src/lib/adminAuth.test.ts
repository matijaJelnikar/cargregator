import { describe, expect, it } from "vitest";
import { jwtExpiry, safeNext } from "./adminAuth";

const jwt = (payload: object) => `x.${btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}.sig`;

describe("jwtExpiry", () => {
  it("reads exp from the payload", () => {
    expect(jwtExpiry(jwt({ exp: 1700000000, sub: "u" }))).toBe(1700000000);
  });
  it("gives 0 for anything unreadable", () => {
    expect(jwtExpiry("garbage")).toBe(0);
    expect(jwtExpiry(jwt({ sub: "u" }))).toBe(0);
  });
});

describe("safeNext", () => {
  it("keeps admin paths", () => {
    expect(safeNext("/admin/g/0b6f3c1e-1111-4222-8333-944445555666/")).toBe("/admin/g/0b6f3c1e-1111-4222-8333-944445555666/");
    expect(safeNext("/admin/reports/?all=1")).toBe("/admin/reports/?all=1");
  });
  it("refuses anything else", () => {
    for (const bad of [null, "", "https://evil.example/admin/", "//evil.example/admin/", "/sl/", "/admin//evil", "/admin/\\evil"])
      expect(safeNext(bad)).toBe("/admin/");
  });
});
