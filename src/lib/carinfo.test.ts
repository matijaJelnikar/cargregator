import { describe, expect, it } from "vitest";
import { CARINFO_FUELS, SkeletonAnswer, engineSlug } from "./carinfo";
import type { CarEngine, CarFailure, CarGeneration, CarRecall } from "./carinfoDb";
import { carLinks } from "./carLinks";
import { engineFor, generationFor, generationsInRange, recallsFor, recallsInYears, risksFor } from "./carinfoMatch";
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
    verdict: null, score: null, annual_cost_min: null, annual_cost_max: null, summary_sl: null, summary_en: null,
  });
  const recall = (id: string, from: number | null, to: number | null): CarRecall => ({
    id, authority: "EU Safety Gate", ref: id, title_en: id, title_sl: null, year_from: from, year_to: to, source_url: "https://example.eu",
  });
  const gen = (slug: string, from: number, to: number | null, engines: CarEngine[] = [], recalls: CarRecall[] = []): CarGeneration => ({
    id: slug, slug, name: slug, code: null, year_from: from, year_to: to, registrations: 0,
    image_url: null, image_credit: null, image_license: null, image_source_url: null,
    status: "skeleton", reviewed_at: null, summary_sl: null, summary_en: null, pros: [], cons: [], ncap_stars: null, ncap_year: null, ncap_url: null,
    engines, recalls, failures: [], checks: [], links: [],
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

describe("outside links for a car", () => {
  const golf = { makeId: "volkswagen", modelId: "volkswagen-golf", makeName: "Volkswagen", modelName: "Golf" };
  const byId = (links: ReturnType<typeof carLinks>) => Object.fromEntries(links.map((l) => [l.id, l]));

  it("uses the probed Avto magazin and ADAC pages when they exist", () => {
    const l = byId(carLinks(golf));
    expect(l.tests).toEqual({ id: "tests", url: "https://avto-magazin.metropolitan.si/avtomobili/volkswagen/golf/", exact: true });
    expect(l.adac.url).toBe("https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/vw/golf/");
  });

  it("falls back to encoded searches for unknown models", () => {
    const l = byId(carLinks({ makeId: "x", modelId: "x-new", makeName: "Škoda", modelName: "Elroq & Co" }));
    expect(l.tests.exact).toBe(false);
    expect(l.tests.url).toBe("https://avto-magazin.metropolitan.si/iskanje/?q=%C5%A0koda%20Elroq%20%26%20Co");
    expect(l.adac.exact).toBe(false);
  });

  it("narrows safety and TÜV searches to the generation", () => {
    const l = byId(carLinks({ ...golf, gen: { name: "Golf VII", year_from: 2012 } }));
    expect(decodeURIComponent(l.safety.url)).toContain("site:euroncap.com Volkswagen Golf 2012");
    expect(decodeURIComponent(l.tuv.url)).toContain("TÜV Report Volkswagen Golf VII Mängel");
  });
});

describe("risks for one car", () => {
  const engine = (id: string, name: string): CarEngine => ({
    id, slug: id, name, engine_code: null, fuel: "petrol", kw: 90, ccm: null, year_from: 2012, year_to: 2020, registrations: 0,
    verdict: null, score: null, annual_cost_min: null, annual_cost_max: null, summary_sl: null, summary_en: null,
  });
  const failure = (id: string, engineId: string | null, from: number | null, to: number | null, likelihood: CarFailure["likelihood"], cost: number | null): CarFailure => ({
    id, engine_id: engineId, area: "engine", title_sl: id, title_en: id, body_sl: null, body_en: null, symptoms_sl: null, symptoms_en: null,
    year_from: from, year_to: to, likelihood, cost_min: null, cost_max: cost, sources: [], ai_check: "supported", status: "ai_checked",
  });
  const engines = [engine("a92", "1.4 TSI"), engine("a110", "1.4 TSI"), engine("d", "2.0 TDI")];
  const gen = {
    engines,
    failures: [
      failure("dsg", null, 2013, 2016, "med", 3000),
      failure("pump", "a110", 2013, 2015, "high", 1200),
      failure("dpf", "d", null, null, "high", 2000),
      failure("lights", null, null, null, "low", 300),
    ],
  } as unknown as CarGeneration;

  it("keeps generation-wide failures and those of any power of the same engine, in the car's years", () => {
    expect(risksFor(gen, { engine: engines[0], year: 2014 }).map((f) => f.id)).toEqual(["dsg", "pump", "lights"]);
  });

  it("drops failures outside the car's year, with one year of slack", () => {
    expect(risksFor(gen, { engine: engines[0], year: 2017 }).map((f) => f.id)).toEqual(["dsg", "lights"]);
    expect(risksFor(gen, { engine: engines[0], year: 2018 }).map((f) => f.id)).toEqual(["lights"]);
  });

  it("without a known engine shows only generation-wide failures", () => {
    expect(risksFor(gen, {}).map((f) => f.id)).toEqual(["dsg", "lights"]);
  });
});
