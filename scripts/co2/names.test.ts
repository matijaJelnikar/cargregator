import { describe, expect, it } from "vitest";
import { findMake } from "../../src/data/makes.ts";
import { modelFor } from "./names.ts";

const model = (makeId: string, cn: string) => modelFor(findMake(makeId)!, cn);

describe("EEA name → model", () => {
  it("matches plain names, the longest model first", () => {
    expect(model("volkswagen", "GOLF / 1.6 / TDI")).toBe("volkswagen-golf");
    expect(model("volkswagen", "GOLF SPORTSVAN")).toBe("volkswagen-golf-sportsvan");
    expect(model("volkswagen", "GOLFPLUS")).toBe("volkswagen-golf-plus");
    expect(model("volkswagen", "VW UP!")).toBe("volkswagen-up");
    expect(model("volkswagen", "ID3 PRO 150 KW")).toBe("volkswagen-id-3");
    expect(model("volkswagen", "ID. BUZZ PRO LR 210 KW")).toBe("volkswagen-id-buzz");
    expect(model("land-rover", "LAND ROVER RANGE ROVER EVOQUE")).toBe("land-rover-range-rover-evoque");
    expect(model("citroen", "GRAND C4 PICASSO")).toBe("citroen-c4-picasso");
    expect(model("audi", "A4 ALLROAD QUATTRO")).toBe("audi-a4-allroad");
    expect(model("audi", "Q4 E-TRON 40")).toBe("audi-q4-e-tron");
  });

  it("reads BMW engines and Mercedes classes", () => {
    expect(model("bmw", "520D XDRIVE")).toBe("bmw-5-series");
    expect(model("bmw", "M340I XDRIVE")).toBe("bmw-3-series");
    expect(model("bmw", "3ERREIHE")).toBe("bmw-3-series");
    expect(model("bmw", "SERIE 1")).toBe("bmw-1-series");
    expect(model("bmw", "X3 XDRIVE20D")).toBe("bmw-x3");
    expect(model("bmw", "IX1 XDRIVE30")).toBeUndefined();
    expect(model("bmw", "X3XDRIVE20D")).toBe("bmw-x3");
    expect(model("bmw", "530DXDRIVE")).toBe("bmw-5-series");
    expect(model("mercedes-benz", "C 220 D")).toBe("mercedes-benz-c-class");
    expect(model("mercedes-benz", "MERCEDES-AMG C 63 S")).toBe("mercedes-benz-c-class");
    expect(model("mercedes-benz", "E-KLASSE")).toBe("mercedes-benz-e-class");
    expect(model("mercedes-benz", "GLC300")).toBe("mercedes-benz-glc");
    expect(model("lexus", "RX450H")).toBe("lexus-rx");
    expect(model("lexus", "LEXUSCT200H")).toBe("lexus-ct");
  });

  it("only takes number-only models as the first word", () => {
    expect(model("mazda", "MAZDA3")).toBe("mazda-3");
    expect(model("mazda", "CX-5 2.2")).toBe("mazda-cx-5");
    expect(model("mazda", "CX-80 2.5")).toBeUndefined();
    expect(model("peugeot", "2008")).toBe("peugeot-2008");
    expect(model("polestar", "POLESTAR 2")).toBe("polestar-2");
    expect(model("ds", "DS 7 CROSSBACK")).toBe("ds-ds-7");
    expect(model("ds", "7 CROSSBACK")).toBe("ds-ds-7");
    expect(model("mg", "MG MG 5 ELECTRIC")).toBe("mg-mg5");
    expect(model("audi", "A4AVANT")).toBe("audi-a4");
    expect(model("mini", "COOPERCABRIO")).toBe("mini-cooper");
  });
});
