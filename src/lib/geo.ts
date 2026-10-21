import { CITIES, PLACES, type City } from "@/data/cities";

const EARTH_RADIUS_KM = 6371;

export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Cities and border towns inside the circle. */
export function placesInCircle(center: City, radiusKm: number, country?: string): City[] {
  return PLACES.filter(
    (c) => (!country || c.country === country) && distanceKm(center, c) <= radiusKm,
  );
}

/** Countries that have at least one bundled city or border town inside the circle. */
export function countriesInCircle(center: City, radiusKm: number): Set<string> {
  return new Set(placesInCircle(center, radiusKm).map((c) => c.country));
}

export function nearestCity(point: { lat: number; lon: number }): City {
  return CITIES.reduce((best, c) => (distanceKm(point, c) < distanceKm(point, best) ? c : best));
}

/** Smallest allowed value that is ≥ wanted, or the largest allowed value. */
export function snapUp(wanted: number, allowed: readonly number[]): number {
  return allowed.find((v) => v >= wanted) ?? allowed[allowed.length - 1];
}

/** A search around one place in the site's country, or (no place) the whole country. */
export interface Anchor {
  place?: City;
  radiusKm?: number;
}

/**
 * One search that best matches the user's circle, for sites that only take a radius around a
 * place in their own country (the user can't be expected to know a German postcode).
 *
 * Every (place, allowed radius) pair in the country is scored on the country's bundled places:
 * +1 for each one it includes that is inside the user's circle, −1 for each one it includes that
 * is outside, so missing cars and too-distant cars weigh the same. A search must include the
 * country's place nearest to the user (the cheapest cars to bring home). Searching the whole
 * country is scored the same way and wins when the circle takes in most of the country.
 * Ties go to the smaller radius, then to the place nearer to the user.
 */
export function bestAnchor(
  center: City,
  radiusKm: number,
  country: string,
  allowedRadii: readonly number[],
): Anchor {
  const places = PLACES.filter((p) => p.country === country).sort(
    (a, b) => distanceKm(center, a) - distanceKm(center, b),
  );
  const inside = (p: City) => distanceKm(center, p) <= radiusKm;
  const score = (included: City[]) => included.reduce((s, p) => s + (inside(p) ? 1 : -1), 0);
  const nearest = places[0];

  let best: Anchor = {};
  let bestScore = -Infinity;
  for (const r of allowedRadii) {
    for (const place of places) {
      if (distanceKm(place, nearest) > r) continue;
      const s = score(places.filter((p) => distanceKm(place, p) <= r));
      if (s > bestScore) {
        best = { place, radiusKm: r };
        bestScore = s;
      }
    }
  }
  return score(places) > bestScore ? {} : best;
}
