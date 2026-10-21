import { describe, expect, it } from "vitest";
import { DEFAULT_FILTERS, type SearchFilters } from "@/lib/filters";
import { buildResults } from "./registry";

const full: SearchFilters = {
  ...DEFAULT_FILTERS,
  makeId: "bmw", modelId: "bmw-3-series", yearFrom: 2016, yearTo: 2021, priceFrom: 8000,
  priceTo: 25000, mileageTo: 150000, powerFromKw: 110, fuel: ["diesel"], gearbox: "automatic",
  body: ["estate"], seller: "dealer", cityId: "si-ljubljana", radiusKm: 400,
};

const result = (f: SearchFilters, id: string) => buildResults(f).find((r) => r.site.id === id)!;
const urls = (f: SearchFilters, id: string) => result(f, id).links.map((l) => decodeURIComponent(l.url));

describe("site links (pinned; update after manual verification)", () => {
  it("avto.net", () => {
    expect(urls(full, "avtonet")).toMatchInlineSnapshot(`
      [
        "https://www.avto.net/Ads/results.asp?znamka=BMW&model=&modelID=&tip=&znamka2=&model2=&tip2=&znamka3=&model3=&tip3=&cenaMin=8000&cenaMax=25000&letnikMin=2016&letnikMax=2021&bencin=0&starost2=999&oblika=0&ccmMin=0&ccmMax=99999&mocMin=0&mocMax=999999&kmMin=0&kmMax=150000&kwMin=110&kwMax=999&motortakt=0&motorvalji=0&lokacija=0&sirina=0&dolzina=&dolzinaMIN=0&dolzinaMAX=100&nosilnostMIN=0&nosilnostMAX=999999&sedezevMIN=0&sedezevMAX=9&lezisc=&presek=0&premer=0&col=0&vijakov=0&EToznaka=0&vozilo=&airbag=&barva=&barvaint=&doseg=0&BkType=0&BkOkvir=0&BkOkvirType=0&Bk4=0&EQ1=1000000000&EQ2=1000000000&EQ3=1000000000&EQ4=100000000&EQ5=1000000000&EQ6=1000001000&EQ7=1110100122&EQ8=1010000000&EQ9=1000000020&EQ10=1000000000&EQ11=1000000000&EQ12=120000000&KAT=1010000000&PIA=&PIAzero=&PIAOut=&PSLO=&akcija=0&paketgarancije=&broker=0&prikazkategorije=0&kategorija=0&ONLvid=0&ONLnak=0&zaloga=10&arhiv=0&presort=3&tipsort=DESC&stran=1&subSORT=2&subTIPSORT=ASC",
      ]
    `);
    expect(result(full, "avtonet").skipped).toEqual(["modelId", "fuel", "gearbox", "body", "seller"]);
    expect(urls({ ...full, makeId: "volkswagen", modelId: "volkswagen-golf" }, "avtonet")[0]).toContain("znamka=Volkswagen&model=Golf&");
  });

  it("mobile.de from Slovenia: one search around the German place that best matches the circle", () => {
    const r = result(full, "mobilede");
    expect(r.location).toBe("approximate");
    expect(r.links).toHaveLength(1);
    expect(r.links[0].anchor).toMatchInlineSnapshot(`
      {
        "city": "Bad Reichenhall",
        "radiusKm": 200,
      }
    `);
    expect(urls(full, "mobilede")[0]).toMatchInlineSnapshot(`"https://suchen.mobile.de/fahrzeuge/search.html?isSearchRequest=true&s=Car&vc=Car&dam=false&sb=doc&od=down&ms=3500;;;&fr=2016:2021&p=8000:25000&ml=:150000&pw=110:&ft=DIESEL&tr=AUTOMATIC_GEAR&c=EstateCar&st=DEALER&cn=DE&gn=83435,+Bad+Reichenhall&ll=47.725,12.877&rd=200"`);
    expect(r.skipped).toEqual(["modelId"]);
  });

  it("mobile.de searches the model by its own id", () => {
    // From a search built on mobile.de: Kia Sorento is ms=13200;24.
    const sorento = { ...full, makeId: "kia", modelId: "kia-sorento" };
    expect(urls(sorento, "mobilede")[0]).toContain("&ms=13200;24&");
    expect(result(sorento, "mobilede").skipped).toEqual([]);
    // Groups (BMW 3 Series) aren't sent yet: make only, model reported as not applied.
    expect(urls(full, "mobilede")[0]).toContain("&ms=3500;;;&");
  });

  it("mobile.de reaches the German border from Slovenia", () => {
    const r = result({ ...full, radiusKm: 250 }, "mobilede");
    expect(r.inRange).toBe(true);
    expect(r.links).toHaveLength(1);
    expect(r.links[0].anchor?.city).toBe("Berchtesgaden");
  });

  it("mobile.de searches all of Germany when the circle takes in most of it", () => {
    const r = result({ ...full, radiusKm: 1000 }, "mobilede");
    expect(r.location).toBe("country");
    expect(r.links).toHaveLength(1);
    expect(r.links[0].anchor).toBeUndefined();
    expect(r.links[0].url).not.toMatch(/[?&](ll|rd|gn)=/);
    expect(r.links[0].url).toContain("&cn=DE");
  });

  it("mobile.de maps known models", () => {
    const r = result({ ...full, makeId: "volkswagen", modelId: "volkswagen-touareg" }, "mobilede");
    expect(decodeURIComponent(r.links[0].url)).toContain("&ms=25200;36&");
    expect(r.skipped).not.toContain("modelId");
  });

  it("mobile.de is exact for a user in Germany", () => {
    const r = result({ ...full, cityId: "de-munchen", radiusKm: 100 }, "mobilede");
    expect(r.location).toBe("exact");
    expect(r.links).toHaveLength(1);
    expect(decodeURIComponent(r.links[0].url)).toContain("&cn=DE&gn=80331,+München&ll=48.1374,11.5755&rd=100");
  });

  it("AutoScout24", () => {
    expect(urls(full, "autoscout24")).toMatchInlineSnapshot(`
      [
        "https://www.autoscout24.com/lst/bmw/3-series-(all)?atype=C&sort=age&desc=1&ustate=N,U&cy=D,A,I&fregfrom=2016&fregto=2021&pricefrom=8000&priceto=25000&kmto=150000&powerfrom=110&powertype=kw&fuel=D&gear=A&body=5&custtype=D&zip=1000+Ljubljana&zipr=400&lat=46.0569&lon=14.5058",
      ]
    `);
    expect(result(full, "autoscout24").skipped).toEqual([]);
    const wide = result({ ...full, radiusKm: 800 }, "autoscout24");
    expect(wide.location).toBe("country");
    expect(wide.links[0].url).not.toContain("zipr=");
  });

  it("willhaben", () => {
    expect(urls(full, "willhaben")).toMatchInlineSnapshot(`
      [
        "https://www.willhaben.at/iad/gebrauchtwagen/auto/gebrauchtwagenboerse?sort=1&keyword=BMW&PRICE_FROM=8000&PRICE_TO=25000&YEAR_MODEL_FROM=2016&YEAR_MODEL_TO=2021&MILEAGE_TO=150000",
      ]
    `);
    expect(result(full, "willhaben").keyword).toBe(true);
    expect(result(full, "willhaben").skipped).toContain("modelId");
  });

  it("Njuškalo", () => {
    expect(urls(full, "njuskalo")).toMatchInlineSnapshot(`
      [
        "https://www.njuskalo.hr/auti/bmw?sort=new&price[min]=8000&price[max]=25000&yearManufactured[min]=2016&yearManufactured[max]=2021&mileage[max]=150000",
      ]
    `);
    expect(result(full, "njuskalo").skipped).toContain("modelId");
    expect(urls({ ...full, makeId: "volkswagen", modelId: "volkswagen-touareg" }, "njuskalo")[0]).toMatch(/\/auti\/vw-touareg\?/);
  });
});

describe("sort order", () => {
  const cheap = { ...full, sort: "price_asc" as const };
  it("maps to each site's own parameter", () => {
    expect(urls(cheap, "mobilede")[0]).toContain("&sb=p&od=up&");
    expect(urls(cheap, "autoscout24")[0]).toContain("?atype=C&sort=price&desc=0&");
    expect(urls(cheap, "willhaben")[0]).toContain("?sort=3&");
    expect(urls(cheap, "njuskalo")[0]).toContain("?sort=cheap&");
  });

  it("reports unmapped orders as not applied", () => {
    expect(result(cheap, "avtonet").skipped).toContain("sort");
    expect(result({ ...full, sort: "mileage_asc" }, "willhaben").skipped).toContain("sort");
    expect(result(cheap, "mobilede").skipped).not.toContain("sort");
  });
});

describe("range", () => {
  it("marks far-away sites out of range", () => {
    const rs = buildResults({ ...DEFAULT_FILTERS, cityId: "si-ljubljana", radiusKm: 50 });
    const inRange = Object.fromEntries(rs.map((r) => [r.site.id, r.inRange]));
    expect(inRange).toEqual({ avtonet: true, mobilede: false, autoscout24: false, willhaben: false, njuskalo: false });
  });

  it("builds no links for disabled sites", () => {
    const r = result({ ...DEFAULT_FILTERS, sites: ["avtonet"] }, "mobilede");
    expect(r.enabled).toBe(false);
    expect(r.links).toEqual([]);
  });

  it("skips makes a site has no mapping for", () => {
    expect(result({ ...DEFAULT_FILTERS, makeId: "trabant" }, "mobilede").skipped).toEqual(["makeId"]);
  });
});
