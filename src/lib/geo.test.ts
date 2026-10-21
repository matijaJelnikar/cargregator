import { describe, expect, it } from "vitest";
import { findCity, PLACES } from "@/data/cities";
import { findSite, radiusToReach } from "./sites/registry";
import { bestAnchor, countriesInCircle, distanceKm, nearestCity, snapUp } from "./geo";

const ljubljana = findCity("si-ljubljana")!;
const RADII = [50, 100, 150, 200];
const german = PLACES.filter((p) => p.country === "DE");

describe("geo", () => {
  it("measures distance", () => {
    expect(distanceKm(ljubljana, findCity("hr-zagreb")!)).toBeCloseTo(117, -1);
  });

  it("finds countries a circle reaches", () => {
    expect([...countriesInCircle(ljubljana, 100)].sort()).toEqual(["AT", "HR", "IT", "SI"]);
    expect(countriesInCircle(ljubljana, 300).has("DE")).toBe(true);
    expect(countriesInCircle(ljubljana, 200).has("DE")).toBe(false);
  });

  it("measures reach to the border, not to the nearest big city", () => {
    // The German border (Berchtesgaden) is ~210 km away; the nearest bundled city (Rosenheim) ~270 km.
    expect(countriesInCircle(ljubljana, 250).has("DE")).toBe(true);
  });

  it("finds the radius that brings a site into range", () => {
    const radius = radiusToReach(findSite("mobilede"), ljubljana)!;
    expect(radius % 25).toBe(0);
    expect(countriesInCircle(ljubljana, radius).has("DE")).toBe(true);
    expect(countriesInCircle(ljubljana, radius - 25).has("DE")).toBe(false);
    expect(radiusToReach(findSite("avtonet"), ljubljana)).toBe(0);
  });

  it("snaps up to allowed values", () => {
    expect(snapUp(120, [50, 100, 200])).toBe(200);
    expect(snapUp(100, [50, 100, 200])).toBe(100);
    expect(snapUp(900, [50, 100, 200])).toBe(200);
  });
});

describe("bestAnchor", () => {
  const pick = (r: number) => {
    const a = bestAnchor(ljubljana, r, "DE", RADII);
    return a.place ? `${a.place.name} ${a.radiusKm} km` : "whole country";
  };

  it("picks one search per radius from Ljubljana", () => {
    expect(Object.fromEntries([250, 300, 400, 500, 600, 1000].map((r) => [r, pick(r)]))).toMatchInlineSnapshot(`
      {
        "1000": "whole country",
        "250": "Berchtesgaden 50 km",
        "300": "Freilassing 100 km",
        "400": "Bad Reichenhall 200 km",
        "500": "Rosenheim 200 km",
        "600": "Augsburg 200 km",
      }
    `);
  });

  it.each([250, 300, 400, 500, 600])("always includes the German place nearest to the user (%i km)", (r) => {
    const nearest = german.reduce((a, b) => (distanceKm(ljubljana, a) <= distanceKm(ljubljana, b) ? a : b));
    const { place, radiusKm } = bestAnchor(ljubljana, r, "DE", RADII);
    expect(distanceKm(place!, nearest)).toBeLessThanOrEqual(radiusKm!);
  });

  it.each([400, 500, 600])("includes more German places inside the circle than outside it (%i km)", (r) => {
    const { place, radiusKm } = bestAnchor(ljubljana, r, "DE", RADII);
    const included = german.filter((p) => distanceKm(place!, p) <= radiusKm!);
    const outside = included.filter((p) => distanceKm(ljubljana, p) > r);
    expect(outside.length).toBeLessThan(included.length - outside.length);
  });

  it("searches the whole country when the circle takes in most of it", () => {
    expect(bestAnchor(ljubljana, 1000, "DE", RADII)).toEqual({});
  });

  it("finds the nearest city", () => {
    expect(nearestCity({ lat: 46.07, lon: 14.52 }).id).toBe("si-ljubljana");
  });
});
