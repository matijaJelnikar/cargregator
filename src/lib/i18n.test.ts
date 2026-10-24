import { describe, expect, it } from "vitest";
import { tn } from "./i18n";

describe("tn", () => {
  const sl = "{n} generacija|{n} generaciji|{n} generacije|{n} generacij";
  it("picks the Slovenian form by count", () => {
    expect([1, 2, 3, 4, 5, 101, 102, 0].map((n) => tn(sl, n, "sl"))).toEqual([
      "1 generacija", "2 generaciji", "3 generacije", "4 generacije", "5 generacij", "101 generacija", "102 generaciji", "0 generacij",
    ]);
  });

  it("picks the English form and copes with a single form", () => {
    expect(tn("{n} engine|{n} engines", 1, "en")).toBe("1 engine");
    expect(tn("{n} engine|{n} engines", 2, "en")).toBe("2 engines");
    expect(tn("{n}/10", 3, "sl")).toBe("3/10");
  });
});
