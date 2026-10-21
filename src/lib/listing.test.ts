import { describe, expect, it } from "vitest";
import { findFuel, findMakeModel, findPrice, parseListing } from "./listing";

// UNVERIFIED: sample URLs follow the patterns we expect; replace them with real shared links once checked.
describe("shared listing", () => {
  it("reads mobile.de links", () => {
    expect(parseListing({ url: "https://suchen.mobile.de/fahrzeuge/details.html?id=412345678&lang=en" })).toMatchObject({
      site: "mobilede", country: "DE", listingId: "412345678",
    });
    expect(
      parseListing({ url: "https://suchen.mobile.de/auto-inserat/bmw-320d-touring-m-sport-muenchen/412345678.html" }),
    ).toMatchObject({ site: "mobilede", listingId: "412345678", makeId: "bmw", modelId: "bmw-3-series", fuel: undefined });
  });

  it("reads the search a mobile.de link carries", () => {
    const url =
      "https://suchen.mobile.de/fahrzeuge/details.html?lang=en&id=44821384287488&vc=Car&c=OffRoad&cn=DE&dam=false&fr=2016%3A2017" +
      "&ft=DIESEL&gn=83022%2C+Rosenheim&ll=47.8571%2C12.1181&ml=%3A200000&ms=25200%3B36&rd=200&tr=AUTOMATIC_GEAR&sb=p&od=up&s=Car";
    expect(parseListing({ url })).toMatchObject({
      site: "mobilede", country: "DE", listingId: "44821384287488",
      makeId: "volkswagen", modelId: "volkswagen-touareg", fuel: "diesel",
    });
    // Kia's model 24 is the Sorento; other makes use 24 for other models.
    expect(parseListing({ url: "https://suchen.mobile.de/fahrzeuge/details.html?id=1&ms=13200%3B24" })).toMatchObject({
      makeId: "kia", modelId: "kia-sorento",
    });
    expect(parseListing({ url: "https://suchen.mobile.de/fahrzeuge/details.html?id=1&ms=25200%3B999&ft=HYBRID" })).toMatchObject({
      makeId: "volkswagen", modelId: undefined, fuel: undefined,
    });
  });

  it("reads AutoScout24 links, the country from the domain", () => {
    const r = parseListing({
      url: "https://www.autoscout24.at/angebote/volkswagen-golf-2-0-tdi-diesel-schwarz-1f2e3d4c-5b6a-7980-a1b2-c3d4e5f6a7b8",
    });
    expect(r).toMatchObject({
      site: "autoscout24", country: "AT", listingId: "1f2e3d4c-5b6a-7980-a1b2-c3d4e5f6a7b8",
      makeId: "volkswagen", modelId: "volkswagen-golf", fuel: "diesel",
    });
    expect(parseListing({ url: "https://www.autoscout24.com/offers/skoda-octavia-1f2e3d4c-5b6a-7980-a1b2-c3d4e5f6a7b8" })?.country).toBeUndefined();
  });

  it("reads willhaben, njuškalo and avto.net links", () => {
    expect(parseListing({ url: "https://www.willhaben.at/iad/gebrauchtwagen/d/auto/skoda-octavia-combi-rs-tdi-1234567890/" })).toMatchObject({
      site: "willhaben", country: "AT", listingId: "1234567890", makeId: "skoda", modelId: "skoda-octavia", fuel: "diesel",
    });
    expect(parseListing({ url: "https://www.njuskalo.hr/auti/mazda-cx-5-2-2-cd-oglas-45678901" })).toMatchObject({
      site: "njuskalo", country: "HR", listingId: "45678901", makeId: "mazda", modelId: "mazda-cx-5",
    });
    expect(parseListing({ url: "https://www.avto.net/Ads/details.asp?id=22765392&display=Renault%20Clio" })).toMatchObject({
      site: "avtonet", country: "SI", listingId: "22765392",
    });
  });

  it("finds the link inside share text and reads title and price from the rest", () => {
    const r = parseListing({
      text: "Schau dir dieses Fahrzeug an: Mercedes-Benz C 220 d T-Modell, 24.990 € https://suchen.mobile.de/fahrzeuge/details.html?id=1.",
    });
    expect(r).toMatchObject({
      url: "https://suchen.mobile.de/fahrzeuge/details.html?id=1",
      makeId: "mercedes-benz", modelId: "mercedes-benz-c-class", price: 24_990, fuel: undefined,
    });
    expect(r?.title).toBe("Schau dir dieses Fahrzeug an: Mercedes-Benz C 220 d T-Modell, 24.990 €");
  });

  it("accepts other sites without guessing, and rejects anything that isn't a web link", () => {
    expect(parseListing({ url: "https://www.example.com/car/1" })).toEqual({
      url: "https://www.example.com/car/1", site: undefined, country: undefined, listingId: undefined,
      fuel: undefined, price: undefined, title: undefined,
    });
    expect(parseListing({ url: "javascript:alert(1)" })).toBeNull();
    expect(parseListing({ text: "no link here" })).toBeNull();
    expect(parseListing({})).toBeNull();
  });

  it("matches make and model, preferring the longest model and mapping engine names to series", () => {
    expect(findMakeModel("Mazda CX-5 2.2")).toEqual({ makeId: "mazda", modelId: "mazda-cx-5" });
    expect(findMakeModel("VW Golf Variant")).toEqual({ makeId: "volkswagen", modelId: "volkswagen-golf" });
    expect(findMakeModel("Alfa Romeo Giulia")).toEqual({ makeId: "alfa-romeo", modelId: "alfa-romeo-giulia" });
    expect(findMakeModel("bmw-530e-touring")).toEqual({ makeId: "bmw", modelId: "bmw-5-series" });
    expect(findMakeModel("Mazda 2019 automatic")).toEqual({ makeId: "mazda", modelId: undefined });
    expect(findMakeModel("Nice car")).toEqual({});
  });

  it("reads fuel and price", () => {
    expect(findFuel("Toyota C-HR 1.8 Hybrid")).toBe("hybrid");
    expect(findFuel("Kuga 2.5 Plug-in Hybrid")).toBe("plugin_hybrid");
    expect(findFuel("Golf 1.5 TSI")).toBe("petrol");
    expect(findPrice("Preis: 12.990 €")).toBe(12_990);
    expect(findPrice("€ 12,990")).toBe(12_990);
    expect(findPrice("EUR 8500,-")).toBe(8500);
    expect(findPrice("12 990,00 €")).toBe(12_990);
    expect(findPrice("150 kW, 2019")).toBeUndefined();
  });
});
