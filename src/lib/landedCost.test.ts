import { describe, expect, it } from "vitest";
import { calculateLandedCost, isNewForVat, type LandedCostInput } from "./landedCost";

const at = new Date(2026, 9, 21);
const base: LandedCostInput = {
  price: 20_000, sellerCountry: "DE", vatShown: true, km: 80_000, fuel: "petrol", co2: 130, cycle: "wltp",
  euro: "6d-temp", firstRegistration: new Date(2019, 2, 1), eightPlusSeats: false, transport: 250, registration: 250, at,
};

describe("landed cost", () => {
  it("treats cars up to 6 months or 6,000 km as new for VAT", () => {
    expect(isNewForVat(undefined, undefined, at)).toBe(true);
    expect(isNewForVat(new Date(2026, 5, 1), 9000, at)).toBe(true);
    expect(isNewForVat(new Date(2024, 0, 1), 5000, at)).toBe(true);
    expect(isNewForVat(new Date(2024, 0, 1), 7000, at)).toBe(false);
    expect(isNewForVat(new Date(2024, 0, 1), undefined, at)).toBe(false);
  });

  it("pays a used car's price as listed", () => {
    const r = calculateLandedCost(base);
    expect(r.newForVat).toBe(false);
    expect(r.carPrice).toBe(20_000);
    expect(r.siVat).toBe(0);
    expect(r.total).toBe(20_543.68); // + DMV 43.68 + 500
  });

  it("buys a nearly new car net and pays Slovenian VAT", () => {
    const r = calculateLandedCost({ ...base, price: 23_800, km: 3000, firstRegistration: new Date(2026, 3, 1) });
    expect(r.newForVat).toBe(true);
    expect(r.carPrice).toBe(20_000); // 23,800 / 1.19
    expect(r.siVat).toBe(4400);
    expect(r.dmv.ageShare).toBe(0.91);
  });

  it("adds Slovenian VAT on a private seller's price for a nearly new car", () => {
    const r = calculateLandedCost({ ...base, vatShown: false, km: 3000 });
    expect(r.carPrice).toBe(20_000);
    expect(r.siVat).toBe(4400);
  });
});
