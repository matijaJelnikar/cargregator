import { describe, expect, it } from "vitest";
import { CARINFO_FUELS, SkeletonAnswer, engineSlug } from "./carinfo";
import type { CarEngine, CarGeneration, CarRecall } from "./carinfoDb";
import { engineFor, generationFor, generationsInRange, recallsFor, recallsInYears } from "./carinfoMatch";
import { FUELS, type Fuel } from "./filters";

const answer = {
  generations: [{ slug: "mk7", name: "Golf VII", code: "5G", year_from: 2012, year_to: 2020, types: ["AU"] }],
  engines: [{ generation: "mk7", name: "1.4 TSI", engine_code: "EA211", variants: ["v6", "v12@2012-2016"] }],
  dropped: [{ variant: "v104", reason: "no such engine" }],
};

describe("carinfo", () => {
  it("uses the same fuels as the filters", () => {
    expect([...CARINFO_FUELS]).toEqual([...FUELS]);
  });

  it("accepts a skeleton answer", () => {
    expect(SkeletonAnswer.parse(answer)).toEqual(answer);
  });

  it("rejects bad slugs, variant ids and empty answers", () => {
    expect(() => SkeletonAnswer.parse({ ...answer, generations: [{ ...answer.generations[0], slug: "Golf 7" }] })).toThrow();
    expect(() => SkeletonAnswer.parse({ ...answer, engines: [{ ...answer.engines[0], variants: ["12"] }] })).toThrow();
    expect(() => SkeletonAnswer.parse({ ...answer, generations: [] })).toThrow();
  });

  it("makes engine slugs from name and power", () => {
    expect(engineSlug("1.4 TSI", 92)).toBe("1-4-tsi-92kw");
    expect(engineSlug("Mégane E-Tech", 160)).toBe("megane-e-tech-160kw");
  });
});

describe("matching a car to car-info data", () => {
  const engine = (id: string, fuel: Fuel, kw: number, from: number | null, to: number | null, registrations = 0): CarEngine => ({
    id, slug: id, name: id, engine_code: null, fuel, kw, ccm: null, year_from: from, year_to: to, registrations,
  });
  const recall = (id: string, from: number | null, to: number | null): CarRecall => ({
    id, authority: "EU Safety Gate", ref: id, title_en: id, title_sl: null, year_from: from, year_to: to, source_url: "https://example.eu",
  });
  const gen = (slug: string, from: number, to: number | null, engines: CarEngine[] = [], recalls: CarRecall[] = []): CarGeneration => ({
    id: slug, slug, name: slug, code: null, year_from: from, year_to: to, registrations: 0, engines, recalls,
  });
  const gens = [gen("mk6", 2008, 2013), gen("mk7", 2012, 2020), gen("mk8", 2019, null)];

  it("picks the generation by year, the newer one in an overlap year, and handles an open end", () => {
    expect(generationFor(gens, 2008)?.slug).toBe("mk6");
    expect(generationFor(gens, 2012)?.slug).toBe("mk7");
    expect(generationFor(gens, 2019)?.slug).toBe("mk8");
    expect(generationFor(gens, 2030)?.slug).toBe("mk8");
    expect(generationFor(gens, 2005)).toBeUndefined();
  });

  it("lists generations in a year range with open ends", () => {
    expect(generationsInRange(gens, 2014, 2018).map((g) => g.slug)).toEqual(["mk7"]);
    expect(generationsInRange(gens, 2020).map((g) => g.slug)).toEqual(["mk7", "mk8"]);
    expect(generationsInRange(gens, undefined, 2009).map((g) => g.slug)).toEqual(["mk6"]);
    expect(generationsInRange(gens).length).toBe(3);
  });

  it("matches an engine by fuel, kW tolerance and year", () => {
    const g = gen("g", 2012, 2020, [
      engine("tdi-81", "diesel", 81, 2012, 2016, 10),
      engine("tdi-85", "diesel", 85, 2016, 2020, 5),
      engine("tsi-81", "petrol", 81, 2012, 2020),
    ]);
    expect(engineFor(g, { fuel: "diesel", kw: 81, year: 2014 })?.id).toBe("tdi-81");
    expect(engineFor(g, { fuel: "diesel", kw: 84, year: 2018 })?.id).toBe("tdi-85"); // 3 kW off, inside the tolerance
    expect(engineFor(g, { fuel: "petrol", kw: 81 })?.id).toBe("tsi-81");
    expect(engineFor(g, { fuel: "electric", kw: 81 })).toBeUndefined();
    expect(engineFor(g, { fuel: "diesel", kw: 120 })).toBeUndefined();
  });

  it("filters recalls by year, keeping those with unknown years", () => {
    const g = gen("g", 2008, 2020, [], [recall("a", 2008, 2010), recall("b", 2014, 2016), recall("c", null, null)]);
    expect(recallsFor(g).length).toBe(3);
    expect(recallsFor(g, 2015).map((r) => r.id)).toEqual(["b", "c"]);
    expect(recallsFor(g, 2011).map((r) => r.id)).toEqual(["a", "c"]); // one year of slack
    expect(recallsInYears(g.recalls, 2012, 2013).map((r) => r.id)).toEqual(["c"]);
  });
});
