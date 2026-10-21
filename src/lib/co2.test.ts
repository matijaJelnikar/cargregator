import { describe, expect, it } from "vitest";
import { euroByRegistration, listEngines, lookupCo2, type Co2Row } from "./co2";

const now = new Date(2026, 9, 21);

const rows: Co2Row[] = [
  ["diesel", 0, 110, 2016, null, 112, 5000, null],
  ["diesel", 0, 111, 2016, null, 116, 1000, null],
  ["diesel", 0, 110, 2018, 140, 115, 3000, null],
  ["diesel", 0, 110, 2024, 122, null, 2000, "6+"],
  ["petrol", 0, 110, 2018, 145, 120, 3000, null],
  ["plugin_hybrid", 0, 110, 2021, 30, null, 800, null],
];

const at = (y: number, m: number) => new Date(y, m - 1, 1);

describe("CO2 lookup", () => {
  it("assumes the Euro norm every new car had to meet at the date", () => {
    expect(euroByRegistration(2010, 6)).toBe("4");
    expect(euroByRegistration(2015, 8)).toBe("5");
    expect(euroByRegistration(2015, 9)).toBe("6");
    expect(euroByRegistration(2019, 8)).toBe("6c");
    expect(euroByRegistration(2019, 9)).toBe("6d-temp");
    expect(euroByRegistration(2021, 1)).toBe("6d");
  });

  it("matches fuel and power within a few kW, weighted by registrations", () => {
    expect(lookupCo2(rows, { fuel: "diesel", kw: 111, firstReg: at(2016, 5), now })).toMatchObject({
      co2: 112, cycle: "nedc", cars: 6000, year: 2016, powerMatched: true,
    });
    expect(lookupCo2(rows, { fuel: "diesel", kw: 150, firstReg: at(2016, 5), now })).toBeUndefined();
    expect(lookupCo2(rows, { fuel: "lpg", kw: 110, firstReg: at(2016, 5), now })).toBeUndefined();
  });

  it("takes NEDC before September 2018 and WLTP after", () => {
    expect(lookupCo2(rows, { fuel: "diesel", kw: 110, firstReg: at(2018, 3), now })).toMatchObject({ co2: 115, cycle: "nedc" });
    expect(lookupCo2(rows, { fuel: "diesel", kw: 110, firstReg: at(2018, 10), now })).toMatchObject({ co2: 140, cycle: "wltp" });
  });

  it("uses the nearest year with data, and the EEA Euro norm from 2023 on", () => {
    expect(lookupCo2(rows, { fuel: "diesel", kw: 110, firstReg: at(2017, 5), now })).toMatchObject({ year: 2016, co2: 112 });
    expect(lookupCo2(rows, { fuel: "diesel", kw: 110, firstReg: undefined, now })).toMatchObject({ year: 2024, co2: 122, euro: "6+" });
    expect(lookupCo2(rows, { fuel: "diesel", kw: 110, firstReg: at(2012, 5), now })).toBeUndefined();
  });

  it("falls back to every power level for hybrids, whose listed power is the system's", () => {
    expect(lookupCo2(rows, { fuel: "plugin_hybrid", kw: 150, firstReg: at(2021, 5), now })).toMatchObject({ co2: 30, powerMatched: false });
    expect(lookupCo2(rows, { fuel: "electric", kw: 150, firstReg: at(2021, 5), now })).toBeUndefined();
  });
});

describe("engine list", () => {
  it("merges power figures a few kW apart, most registered first", () => {
    expect(listEngines(rows)).toEqual([
      { fuel: "diesel", kw: 110, cars: 11000, fromYear: 2016, toYear: 2024 },
      { fuel: "petrol", kw: 110, cars: 3000, fromYear: 2018, toYear: 2018 },
      { fuel: "plugin_hybrid", kw: 110, cars: 800, fromYear: 2021, toYear: 2021 },
    ]);
  });

  it("keeps engines registered within a year of the car's", () => {
    expect(listEngines(rows, 2021).map((e) => [e.fuel, e.cars])).toEqual([["plugin_hybrid", 800]]);
    expect(listEngines(rows, 2017).map((e) => [e.fuel, e.cars])).toEqual([["diesel", 9000], ["petrol", 3000]]);
    expect(listEngines(undefined)).toEqual([]);
  });
});
