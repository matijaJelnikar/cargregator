import { describe, expect, it } from "vitest";
import { CODE_FIXES, correctedEngineCode, engineIdentityIssues } from "./engine-codes";

describe("verified engine-code corrections", () => {
  it("repairs known identities and is idempotent", () => {
    for (const f of CODE_FIXES) {
      expect(correctedEngineCode({ ...f, code: f.oldCode })).toBe(f.code);
      expect(correctedEngineCode({ ...f, code: f.code })).toBe(f.code);
    }
  });
  it("does not guess across models, generations, outputs, fuels or displacement", () => {
    const row = { ...CODE_FIXES[0], code: null };
    for (const change of [{ model: "renault-clio" }, { generation: "mk2" }, { kw: 67 }, { fuel: "lpg" }, { ccm: 1199 }, { ccm: null }]) {
      expect(correctedEngineCode({ ...row, ...change })).toBeNull();
    }
    expect(correctedEngineCode({ ...row, code: "H5D 490" })).toBe("H5D 490");
  });
  it("flags combustion data gaps without flagging electric displacement", () => {
    expect(engineIdentityIssues({ code: null, ccm: null, fuel: "electric" })).toEqual([]);
    expect(engineIdentityIssues({ code: " ", ccm: null, fuel: "hybrid" })).toHaveLength(3);
    expect(engineIdentityIssues({ code: "H5D", ccm: 999, fuel: "petrol" })).toEqual([]);
  });
});
