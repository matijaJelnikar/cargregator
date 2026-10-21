// Parameter set copied from a search built on avto.net itself (2026-10-21); see docs/sites/avtonet.md.
// The site may ignore filters (e.g. price) when its other form fields are missing, so we send all of them.
import { findMake, findModel } from "@/data/makes";
import type { SiteAdapter } from "./types";

const BASE = "https://www.avto.net/Ads/results.asp";

// avto.net's own defaults for every field; build() overwrites the ones we filter on. Order kept as the site sends it.
const TEMPLATE =
  "znamka=&model=&modelID=&tip=&znamka2=&model2=&tip2=&znamka3=&model3=&tip3=&cenaMin=0&cenaMax=999999" +
  "&letnikMin=0&letnikMax=2090&bencin=0&starost2=999&oblika=0&ccmMin=0&ccmMax=99999&mocMin=0&mocMax=999999" +
  "&kmMin=0&kmMax=9999999&kwMin=0&kwMax=999&motortakt=0&motorvalji=0&lokacija=0&sirina=0&dolzina=&dolzinaMIN=0" +
  "&dolzinaMAX=100&nosilnostMIN=0&nosilnostMAX=999999&sedezevMIN=0&sedezevMAX=9&lezisc=&presek=0&premer=0&col=0" +
  "&vijakov=0&EToznaka=0&vozilo=&airbag=&barva=&barvaint=&doseg=0&BkType=0&BkOkvir=0&BkOkvirType=0&Bk4=0" +
  "&EQ1=1000000000&EQ2=1000000000&EQ3=1000000000&EQ4=100000000&EQ5=1000000000&EQ6=1000001000&EQ7=1110100122" +
  "&EQ8=1010000000&EQ9=1000000020&EQ10=1000000000&EQ11=1000000000&EQ12=120000000&KAT=1010000000&PIA=&PIAzero=" +
  "&PIAOut=&PSLO=&akcija=0&paketgarancije=&broker=0&prikazkategorije=0&kategorija=0&ONLvid=0&ONLnak=0&zaloga=10" +
  "&arhiv=0&presort=3&tipsort=DESC&stran=1&subSORT=2&subTIPSORT=ASC";

export const avtonet: SiteAdapter = {
  id: "avtonet",
  name: "avto.net",
  countries: ["SI"],
  location: "country",
  supports: ["makeId", "modelId", "yearFrom", "yearTo", "priceFrom", "priceTo", "mileageTo", "powerFromKw", "sort"],
  build(f) {
    const make = findMake(f.makeId);
    const model = findModel(f.makeId, f.modelId);
    const q = new URLSearchParams(TEMPLATE);
    // avto.net expects its own make/model names; ours match for most makes.
    q.set("znamka", make?.name ?? "");
    q.set("model", model && !model.series ? model.name : "");
    if (f.priceFrom !== undefined) q.set("cenaMin", String(f.priceFrom));
    if (f.priceTo !== undefined) q.set("cenaMax", String(f.priceTo));
    if (f.yearFrom !== undefined) q.set("letnikMin", String(f.yearFrom));
    if (f.yearTo !== undefined) q.set("letnikMax", String(f.yearTo));
    if (f.mileageTo !== undefined) q.set("kmMax", String(f.mileageTo));
    if (f.powerFromKw !== undefined) q.set("kwMin", String(f.powerFromKw));
    // Only newest is mapped; avto.net's other presort codes are unknown.
    const sortSkipped = f.sort && f.sort !== "newest";
    return {
      links: [{ url: `${BASE}?${q}` }],
      skipped: [...(model?.series ? ["modelId" as const] : []), ...(sortSkipped ? ["sort" as const] : [])],
    };
  },
};
