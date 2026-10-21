import { describe, expect, it } from "vitest";
import type { Co2Data } from "./co2";
import { DEFAULT_FILTERS } from "./filters";
import { evaluateCar, findCo2, initialCarInput, resolveCar, withListing, type CarInput } from "./carInput";

const now = new Date(2026, 9, 21);

const base: CarInput = {
  ...initialCarInput(DEFAULT_FILTERS),
  price: 20_000, regMonth: 3, regYear: 2019, km: 80_000, co2: 130, euro: "6d-temp",
};

const data: Co2Data = {
  "volkswagen-golf": [
    ["diesel", 0, 110, 2016, null, 112, 5000, null],
    ["diesel", 0, 110, 2019, 141, 115, 4000, null],
    ["hybrid", 1, 140, 2022, 135, null, 900, null],
  ],
};

describe("car input", () => {
  it("prefills from the search, then from the link", () => {
    const filters = { ...DEFAULT_FILTERS, makeId: "bmw", yearFrom: 2018, yearTo: 2018, fuel: ["diesel" as const] };
    expect(initialCarInput(filters)).toMatchObject({ country: "DE", regYear: 2018, fuel: "diesel", makeId: "bmw", price: undefined });
    expect(
      initialCarInput(filters, { url: "x", country: "AT", fuel: "petrol", price: 9000, makeId: "volkswagen", modelId: "volkswagen-golf" }),
    ).toMatchObject({ country: "AT", fuel: "petrol", price: 9000, makeId: "volkswagen", modelId: "volkswagen-golf" });
    // Countries we have no VAT rate for keep the default.
    expect(initialCarInput(filters, { url: "x", country: "CH" }).country).toBe("DE");
  });

  it("estimates from the search's ranges without a link", () => {
    const filters = {
      ...DEFAULT_FILTERS, makeId: "bmw", yearFrom: 2017, yearTo: 2020, priceFrom: 15_000, priceTo: 22_250, mileageTo: 120_000, powerFromKw: 110,
    };
    expect(initialCarInput(filters)).toMatchObject({ price: 18_600, regYear: 2019, regMonth: 7, km: 120_000, kw: 110 });
    expect(initialCarInput({ ...DEFAULT_FILTERS, yearTo: 2015, priceTo: 9000 })).toMatchObject({ price: 9000, regYear: 2015, regMonth: 7 });
    expect(initialCarInput(DEFAULT_FILTERS)).toMatchObject({ price: undefined, regYear: undefined, regMonth: undefined, km: undefined });
    // A link describes the actual car: the ranges don't stand in for it.
    expect(initialCarInput(filters, { url: "x" })).toMatchObject({ price: undefined, regYear: undefined, km: undefined, kw: undefined });
  });

  it("takes what a link added later knows, keeping the rest", () => {
    const car: CarInput = { ...base, makeId: "bmw", modelId: "bmw-3", fuel: "diesel", kw: 110 };
    expect(withListing(car, { url: "x", country: "AT", makeId: "volkswagen", modelId: "volkswagen-golf" })).toMatchObject({
      country: "AT", makeId: "volkswagen", modelId: "volkswagen-golf", fuel: "diesel", price: 20_000, kw: 110, regYear: 2019,
    });
    expect(withListing(car, { url: "x", country: "CH" })).toEqual(car);
  });

  it("lists what is missing", () => {
    const empty = resolveCar({ ...base, price: undefined, regMonth: undefined, regYear: undefined, co2: undefined, euro: "" }, undefined, now);
    expect(evaluateCar(empty, now)).toEqual({ kind: "missing", missing: ["price", "firstReg", "co2", "euro"] });
    expect(evaluateCar({ ...base, fuel: "electric", co2: undefined, euro: "" }, now).kind).toBe("import");
  });

  it("gives the same total as the landed-cost calculation", () => {
    const r = evaluateCar(base, now);
    expect(r.kind === "import" && r.cost.total).toBe(20_543.68); // as in landedCost.test.ts
  });

  it("only counts the price for a car already in Slovenia", () => {
    expect(evaluateCar({ ...base, country: "SI", co2: undefined, euro: "" }, now)).toEqual({ kind: "domestic", total: 20_000 });
    expect(evaluateCar({ ...base, country: "SI", price: undefined }, now)).toEqual({ kind: "missing", missing: ["price"] });
  });

  it("charges a diesel hybrid on the diesel scale", () => {
    const hybrid = { ...base, fuel: "hybrid" as const, isNew: true, km: 10_000, co2: 110, euro: "6d" as const };
    const petrol = evaluateCar(hybrid, now);
    const diesel = evaluateCar({ ...hybrid, dieselHybrid: true }, now);
    expect(petrol.kind === "import" && petrol.cost.dmv.total).toBe(57);
    expect(diesel.kind === "import" && diesel.cost.dmv.total).toBeGreaterThan(57);
  });

  it("fills in CO2 from the model, fuel and power, and the Euro norm from the date", () => {
    const car: CarInput = { ...base, co2: undefined, euro: "", makeId: "volkswagen", modelId: "volkswagen-golf", fuel: "diesel", kw: 110 };
    const auto = findCo2(car, data, now);
    expect(auto).toMatchObject({ co2: 141, cycle: "wltp", year: 2019, powerMatched: true });
    expect(resolveCar(car, auto, now)).toMatchObject({ co2: 141, cycle: "wltp", euro: "6c" });
    // Only the year: mid-year, so a 2016 car takes NEDC.
    const old = { ...car, regMonth: undefined, regYear: 2016 };
    expect(resolveCar(old, findCo2(old, data, now), now)).toMatchObject({ co2: 112, cycle: "nedc", euro: "6" });
    // Without power there is nothing to look up; the Euro norm still comes from the date.
    expect(findCo2({ ...car, kw: undefined }, data, now)).toBeUndefined();
    expect(resolveCar({ ...car, kw: undefined }, undefined, now)).toMatchObject({ co2: undefined, euro: "6c" });
  });

  it("keeps the user's figures over the automatic ones", () => {
    const car: CarInput = { ...base, co2: 150, cycle: "nedc", euro: "6", makeId: "volkswagen", modelId: "volkswagen-golf", fuel: "diesel", kw: 110 };
    expect(resolveCar(car, findCo2(car, data, now), now)).toMatchObject({ co2: 150, cycle: "nedc", euro: "6" });
    const unknown = { ...car, co2: undefined, co2Unknown: true };
    expect(resolveCar(unknown, findCo2(unknown, data, now), now).co2).toBeUndefined();
  });

  it("takes the diesel scale for a hybrid from the data", () => {
    const car: CarInput = { ...base, co2: undefined, euro: "", modelId: "volkswagen-golf", fuel: "hybrid", kw: 140, regYear: 2022 };
    expect(resolveCar(car, findCo2(car, data, now), now).dieselHybrid).toBe(true);
    expect(resolveCar({ ...car, dieselHybrid: false }, findCo2(car, data, now), now).dieselHybrid).toBe(false);
  });
});
