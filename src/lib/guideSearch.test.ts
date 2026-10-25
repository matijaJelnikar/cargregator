import { describe, expect, it } from "vitest";
import { guideHref, searchGuide, type GuideHit } from "./guideSearch";

/** "Volkswagen Golf", or just the make for an "all models" entry. */
const label = (hit: GuideHit) => (hit.model ? `${hit.make.name} ${hit.model.name}` : hit.make.name);
const labels = (query: string) => searchGuide(query).map(label);
const first = (query: string) => labels(query)[0];

describe("guide search", () => {
  it("has no results for an empty or punctuation-only query", () => {
    expect(searchGuide("")).toEqual([]);
    expect(searchGuide("   ")).toEqual([]);
    expect(searchGuide(" - ")).toEqual([]);
  });

  it("ignores case and diacritics", () => {
    expect(first("skoda octavia")).toBe("Škoda Octavia");
    expect(first("CITROEN")).toBe("Citroën");
    expect(first("megane")).toBe("Renault Mégane");
  });

  it("puts an exact model name before longer names that contain it", () => {
    expect(first("golf")).toBe("Volkswagen Golf");
    expect(labels("golf")).toContain("Volkswagen Golf Plus");
  });

  it("matches words split across the make and the model", () => {
    expect(first("audi a4")).toBe("Audi A4");
    expect(first("a4 audi")).toBe("Audi A4");
    expect(labels("bmw x5")).toEqual(["BMW X5"]);
  });

  it("treats punctuation and spaces alike", () => {
    for (const query of ["c class", "c-class", "cclass"]) expect(first(query)).toBe("Mercedes-Benz C-Class");
    for (const query of ["id 3", "id3", "ID.3"]) expect(first(query)).toBe("Volkswagen ID.3");
  });

  it("offers the make itself before its models", () => {
    const hits = searchGuide("bmw");
    expect(hits[0].model).toBeUndefined();
    expect(label(hits[0])).toBe("BMW");
    expect(hits[1].model?.name).toBe("1 Series");
  });

  it("knows the names people actually type", () => {
    expect(first("vw golf")).toBe("Volkswagen Golf");
    expect(labels("vw")[0]).toBe("Volkswagen");
  });

  it("stops at the result limit", () => {
    expect(searchGuide("a").length).toBeLessThanOrEqual(8);
  });

  it("has no results for a car that isn't in the guide", () => {
    expect(searchGuide("zzzz")).toEqual([]);
  });

  it("links a model to its page and a make to its model list", () => {
    const [model, make] = [searchGuide("golf")[0], searchGuide("bmw")[0]];
    expect(guideHref("sl", model)).toBe("/sl/avti/volkswagen/golf/");
    expect(guideHref("en", make)).toBe("/en/avti/bmw/");
  });
});
