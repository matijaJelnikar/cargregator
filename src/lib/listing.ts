// Reads what a shared listing link (and the text a share sheet sends with it) tells us about the car.
// We never fetch the listing page: the sites' terms forbid it. Everything here comes from what the user sent.
// UNVERIFIED: URL patterns are from memory; check them on real links (docs/IMPORT-COST.md).

import { MAKES, modelSlug } from "@/data/makes";
import type { Fuel, SiteId } from "./filters";
import { FUEL as MOBILEDE_FUEL, MAKE_IDS as MOBILEDE_MAKES, MODEL_IDS as MOBILEDE_MODELS } from "./sites/mobilede";
import { findSite } from "./sites/registry";

export interface ListingInfo {
  url: string;
  site?: SiteId;
  /** ISO code of the country the car is most likely in; a guess the user can change. */
  country?: string;
  listingId?: string;
  makeId?: string;
  modelId?: string;
  fuel?: Fuel;
  /** EUR, from the share text. */
  price?: number;
  title?: string;
}

export interface SharedListing {
  url?: string | null;
  text?: string | null;
  title?: string | null;
}

const MAX_URL = 2000;

// AutoScout24 runs one site per country; the car is usually in that country.
const AUTOSCOUT24_TLDS: Record<string, string> = {
  de: "DE", at: "AT", it: "IT", be: "BE", nl: "NL", fr: "FR", es: "ES", lu: "LU",
};

const UUID = /-?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface HostMatch {
  site: SiteId;
  country?: string;
  listingId?: string;
  /** Words describing the car, from the URL path. */
  slug?: string;
  /** From the search a mobile.de link still carries (ms=<make>;<model>, ft=<fuel>). */
  makeId?: string;
  modelId?: string;
  fuel?: Fuel;
}

const keyOf = (table: Record<string, string>, value: string | undefined) =>
  value ? Object.keys(table).find((k) => table[k] === value) : undefined;

/** A mobile.de detail link keeps the search it came from: ms=25200;36 (make;model), ft=DIESEL. */
function mobiledeSearch(u: URL): Pick<HostMatch, "makeId" | "modelId" | "fuel"> {
  const [make, model] = (u.searchParams.get("ms") ?? "").split(";");
  const makeId = keyOf(MOBILEDE_MAKES, make);
  // Model ids repeat across makes (Kia 24 is the Sorento, BMW 24 the 7 Series group): look within the make.
  const modelId = makeId && model
    ? Object.keys(MOBILEDE_MODELS).find((k) => k.startsWith(`${makeId}-`) && MOBILEDE_MODELS[k] === model)
    : undefined;
  const fuels = u.searchParams.getAll("ft");
  // One fuel only; HYBRID covers both hybrids and plug-ins, so it can't tell which.
  const fuel = fuels.length === 1 && fuels[0] !== "HYBRID" ? (keyOf(MOBILEDE_FUEL, fuels[0]) as Fuel | undefined) : undefined;
  return { makeId, modelId, fuel };
}

function matchHost(u: URL): HostMatch | undefined {
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  const segments = u.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  const last = segments.at(-1) ?? "";

  if (host === "mobile.de" || host.endsWith(".mobile.de")) {
    // details.html?id=123 or /auto-inserat/<slug>/<id>.html
    const seo = u.pathname.match(/\/auto-inserat\/([^/]+)\/(\d+)\.html/);
    return { site: "mobilede", listingId: u.searchParams.get("id") ?? seo?.[2], slug: seo?.[1], ...mobiledeSearch(u) };
  }
  const as24 = host.match(/(?:^|\.)autoscout24\.([a-z]+)$/);
  if (as24) {
    // /angebote/<make>-<model>-<words>-<uuid> (/offers/, /annunci/, /offerte/, /offres/, /ofertas/)
    const uuid = last.match(UUID)?.[0].replace(/^-/, "");
    return { site: "autoscout24", country: AUTOSCOUT24_TLDS[as24[1]], listingId: uuid, slug: last.replace(UUID, "") };
  }
  if (host === "willhaben.at" || host.endsWith(".willhaben.at")) {
    // /iad/gebrauchtwagen/d/auto/<slug>-<id>/
    const m = last.match(/^(.*?)-?(\d{6,})$/);
    return { site: "willhaben", listingId: m?.[2], slug: m?.[1] ?? last };
  }
  if (host === "njuskalo.hr" || host.endsWith(".njuskalo.hr")) {
    // /auti/<slug>-oglas-<id>
    const m = last.match(/^(.*?)-oglas-(\d+)$/);
    return { site: "njuskalo", listingId: m?.[2], slug: m?.[1] ?? last };
  }
  if (host === "avto.net" || host.endsWith(".avto.net")) {
    return { site: "avtonet", listingId: u.searchParams.get("id") ?? u.searchParams.get("ID") ?? undefined };
  }
  return undefined;
}

/** "Škoda Octavia 2.0 TDI" → "skoda-octavia-2-0-tdi" */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const MAKE_ALIASES: Record<string, string> = { vw: "volkswagen", mercedes: "mercedes-benz", alfa: "alfa-romeo" };
// How many words after the make we look for the model, so "Mazda … 3 owners" doesn't become a Mazda 3.
const MODEL_WINDOW = 4;

/** Finds make and model in normalized text, e.g. "bmw-320d-touring" → bmw, bmw-3-series. */
export function findMakeModel(text: string): { makeId?: string; modelId?: string } {
  const words = normalize(text).split("-");
  for (let i = 0; i < words.length; i++) {
    for (const make of MAKES) {
      const makeWords = make.id.split("-");
      const alias = MAKE_ALIASES[words[i]];
      const len = words.slice(i, i + makeWords.length).join("-") === make.id ? makeWords.length : alias === make.id ? 1 : 0;
      if (!len) continue;
      const rest = words.slice(i + len, i + len + MODEL_WINDOW).join("-");
      return { makeId: make.id, modelId: findModel(make.id, rest) };
    }
  }
  return {};
}

function findModel(makeId: string, rest: string): string | undefined {
  const make = MAKES.find((m) => m.id === makeId)!;
  // The model must start right after the make; the longest slug wins ("cx-5" over "5").
  const hit = make.models
    .filter((m) => `${rest}-`.startsWith(`${modelSlug(makeId, m.id)}-`))
    .sort((a, b) => b.id.length - a.id.length)[0];
  if (hit) return hit.id;
  // Listings name the engine, not our series: BMW 320d → 3 Series, Mercedes C 220 → C-Class.
  const first = rest.split("-");
  if (makeId === "bmw") {
    const n = first[0].match(/^([1-8])\d{2}[a-z]{0,2}$/)?.[1];
    if (n) return `bmw-${n}-series`;
  }
  if (makeId === "mercedes-benz" && /^[abces]$/.test(first[0]) && /^\d{3}/.test(first[1] ?? "")) {
    return `mercedes-benz-${first[0]}-class`;
  }
  return undefined;
}

// Checked in order: "plug-in hybrid" must win over "hybrid".
const FUEL_WORDS: [Fuel, string[]][] = [
  ["plugin_hybrid", ["plug-in", "plugin", "phev", "plug-in-hybrid", "plug-in-hibrid"]],
  ["hybrid", ["hybrid", "hibrid", "ibrida", "hev", "mhev"]],
  ["electric", ["elektro", "electric", "elektricni", "elettrica", "bev"]],
  ["lpg", ["lpg", "autogas", "gpl"]],
  ["cng", ["cng", "erdgas", "metano"]],
  ["diesel", ["diesel", "dizel", "tdi", "cdi", "crdi", "hdi", "dci", "jtd", "multijet", "bluehdi"]],
  ["petrol", ["benzin", "benzina", "benzinac", "petrol", "gasoline", "tsi", "tfsi"]],
];

export function findFuel(text: string): Fuel | undefined {
  const s = `-${normalize(text)}-`;
  return FUEL_WORDS.find(([, words]) => words.some((w) => s.includes(`-${w}-`)))?.[0];
}

// "12.990 €", "€ 12,990", "EUR 12990", "12 990,00 €"
const AMOUNT = String.raw`(\d{1,3}(?:[.,\s  ]\d{3})+|\d{3,7})(?:[.,]\d{2}|,-)?`;
const PRICE = [new RegExp(String.raw`(?:€|EUR)\s*${AMOUNT}`, "i"), new RegExp(String.raw`${AMOUNT}\s*(?:€|EUR)`, "i")];

export function findPrice(text: string): number | undefined {
  for (const re of PRICE) {
    const m = text.match(re);
    if (!m) continue;
    const n = Number(m[1].replace(/[.,\s  ]/g, ""));
    if (n >= 100 && n <= 10_000_000) return n;
  }
  return undefined;
}

function toUrl(s: string | null | undefined): URL | undefined {
  if (!s) return undefined;
  const found = s.trim().match(/https?:\/\/[^\s<>"']+/i)?.[0].replace(/[).,;!?]+$/, "");
  if (!found || found.length > MAX_URL) return undefined;
  try {
    const u = new URL(found);
    return u.protocol === "https:" || u.protocol === "http:" ? u : undefined;
  } catch {
    return undefined;
  }
}

/** Reads a shared listing; null when it contains no web link. */
export function parseListing(shared: SharedListing): ListingInfo | null {
  const u = toUrl(shared.url) ?? toUrl(shared.text) ?? toUrl(shared.title);
  if (!u) return null;
  const url = u.toString();
  const words = [shared.title, shared.text].filter(Boolean).join(" ").replace(/https?:\/\/\S+/gi, " ").trim();
  const host = matchHost(u);
  const site = host ? findSite(host.site) : undefined;

  const fromSlug = host?.slug ? findMakeModel(host.slug) : host?.makeId ? { makeId: host.makeId, modelId: host.modelId } : {};
  const fromText = fromSlug.makeId ? {} : findMakeModel(words);
  const fuel = findFuel([host?.slug, words].filter(Boolean).join(" ")) ?? host?.fuel;
  const price = words ? findPrice(words) : undefined;
  const title = (shared.title?.trim() || words).replace(/\s+/g, " ").slice(0, 120) || undefined;

  return {
    url,
    site: host?.site,
    country: host?.country ?? (site?.countries.length === 1 ? site.countries[0] : undefined),
    listingId: host?.listingId,
    ...fromSlug,
    ...fromText,
    fuel,
    price,
    title,
  };
}
