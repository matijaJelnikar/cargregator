import { describe, expect, it } from "vitest";
import { DEFAULT_FILTERS, fromQuery, hpToKw, kwToHp, toQuery, type SearchFilters } from "./filters";

describe("filters URL serialisation", () => {
  it("round-trips a full search", () => {
    const f: SearchFilters = {
      makeId: "bmw", modelId: "bmw-3-series", yearFrom: 2015, yearTo: 2020, priceFrom: 5000,
      priceTo: 20000, mileageTo: 150000, powerFromKw: 100, fuel: ["diesel", "hybrid"],
      gearbox: "automatic", body: ["estate"], seller: "dealer", sort: "price_asc", cityId: "si-maribor",
      radiusKm: 200, sites: ["avtonet", "mobilede"],
    };
    expect(fromQuery(toQuery(f))).toEqual(f);
  });

  it("uses short readable keys", () => {
    expect(toQuery({ ...DEFAULT_FILTERS, makeId: "audi", fuel: ["diesel"] })).toBe(
      "make=audi&city=si-ljubljana&r=300&fuel=diesel&sites=avtonet%2Cmobilede%2Cautoscout24%2Cwillhaben%2Cnjuskalo",
    );
  });

  it("falls back to defaults for an empty query", () => {
    expect(fromQuery("")).toEqual(DEFAULT_FILTERS);
  });

  it("drops invalid values but keeps the rest", () => {
    const f = fromQuery("make=vw&yf=abc&r=5&fuel=diesel,steam&sites=mobilede,ebay&gear=cvt");
    expect(f).toEqual({ ...DEFAULT_FILTERS, makeId: "vw", fuel: ["diesel"], sites: ["mobilede"] });
  });

  it("keeps an explicitly empty site list", () => {
    expect(fromQuery("sites=").sites).toEqual([]);
  });
});

describe("power units", () => {
  it("converts hp and kW", () => {
    expect(hpToKw(150)).toBe(110);
    expect(kwToHp(110)).toBe(150);
  });
});
