import { describe, expect, it } from "vitest";
import { calculateDmv, co2Obligation, euroObligation, nedcToWltp, yearsOver } from "./dmv";

const at = new Date(2026, 9, 21);

describe("DMV (ZDMV-1)", () => {
  it("charges by CO2 band: minimum plus surcharge above the lower limit", () => {
    expect(co2Obligation(50, "petrol")).toBe(0);
    expect(co2Obligation(80, "petrol")).toBeCloseTo(12); // 0.4 × 30
    expect(co2Obligation(135, "petrol")).toBeCloseTo(44.5); // 20 + 0.7 × 35
    expect(co2Obligation(135, "diesel")).toBeCloseTo(53); // 25 + 0.8 × 35
    expect(co2Obligation(160, "petrol")).toBe(148); // 48 + 5 × 20
    expect(co2Obligation(200, "diesel")).toBe(717); // 357 + 36 × 10
    expect(co2Obligation(250, "petrol")).toBe(2498); // 1498 + 50 × 20
  });

  it("uses 1.5 × the top minimum when CO2 is unknown", () => {
    expect(co2Obligation(undefined, "petrol")).toBe(2247);
    expect(co2Obligation(undefined, "diesel")).toBe(2695.5);
  });

  it("converts NEDC to WLTP and rounds", () => {
    expect(nedcToWltp(120, "petrol")).toBe(146); // 146.4
    expect(nedcToWltp(120, "diesel")).toBe(144);
  });

  it("charges by Euro norm, Euro 0 when unknown", () => {
    expect(euroObligation("6d", "petrol")).toBe(30);
    expect(euroObligation("5", "diesel")).toBe(225);
    expect(euroObligation(undefined, "diesel")).toBe(1000);
  });

  it("counts age in the law's 'over N years' steps", () => {
    expect(yearsOver(new Date(2026, 3, 1), at)).toBe(0);
    expect(yearsOver(new Date(2025, 9, 21), at)).toBe(0); // exactly one year: still "up to 1 year"
    expect(yearsOver(new Date(2025, 9, 1), at)).toBe(1);
    expect(yearsOver(new Date(2019, 2, 1), at)).toBe(7);
    expect(yearsOver(new Date(2005, 0, 1), at)).toBe(10);
  });

  it("calculates a used petrol car", () => {
    // 2019-03, 130 g/km WLTP, Euro 6d-TEMP: (41 + 50) × 48 %
    const r = calculateDmv({ fuel: "petrol", co2: 130, cycle: "wltp", euro: "6d-temp", firstRegistration: new Date(2019, 2, 1), eightPlusSeats: false, at });
    expect(r.co2Part).toBeCloseTo(41);
    expect(r.euroPart).toBe(50);
    expect(r.ageShare).toBe(0.48);
    expect(r.total).toBe(43.68);
  });

  it("calculates an older diesel from NEDC with the seats reduction", () => {
    // 2016-06, 150 g/km NEDC → 180 WLTP, Euro 6: (57 + 6 × 40 + 112) × 0.7 × 33 %
    const r = calculateDmv({ fuel: "diesel", co2: 150, cycle: "nedc", euro: "6", firstRegistration: new Date(2016, 5, 1), eightPlusSeats: true, at });
    expect(r.co2Wltp).toBe(180);
    expect(r.total).toBe(94.48);
  });

  it("uses the petrol scale for hybrids and charges nothing for electric cars", () => {
    const hybrid = calculateDmv({ fuel: "hybrid", co2: 110, cycle: "wltp", euro: "6d", eightPlusSeats: false, at });
    expect(hybrid.total).toBe(57); // 20 + 0.7 × 10 + 30, new car
    expect(calculateDmv({ fuel: "electric", cycle: "wltp", eightPlusSeats: false, at }).total).toBe(0);
  });

  it("uses the diesel scale for a diesel hybrid when told so", () => {
    const r = calculateDmv({ fuel: "hybrid", scale: "diesel", co2: 110, cycle: "wltp", euro: "6d", eightPlusSeats: false, at });
    expect(r.total).toBe(78); // 25 + 0.8 × 10 + 45, new car
  });
});
