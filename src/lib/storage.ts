// Browser-only persistence. Every access is wrapped: storage can be missing or blocked.
import type { CarInput } from "./carInput";
import type { Co2Match } from "./co2";
import { fromQuery, toQuery, type SearchFilters, type SiteId } from "./filters";

export const LAST_KEY = "cargregator:last";
export const SAVED_KEY = "cargregator:saved";
export const OPENED_KEY = "cargregator:opened";
export const CARS_KEY = "cargregator:cars";
/** "light" or "dark"; nothing stored follows the system. Read before paint by the layout's inline script. */
export const THEME_KEY = "cargregator:theme";

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  createdAt: string;
  lastRunAt?: string;
}

/** A car the user found on a listing site and checked on the import page. */
export interface SavedCar {
  id: string;
  title: string;
  url?: string;
  site?: SiteId;
  addedAt: string;
  input: CarInput;
  /** The automatic CO2 figures when saved, so the list needs no CO2 data. */
  auto?: Co2Match;
}

export type StoreName = "local" | "session";
const stores: Record<StoreName, () => Storage> = {
  local: () => window.localStorage,
  session: () => window.sessionStorage,
};
const local = "local";
const session = "session";

// Change notifications for useSyncExternalStore: our own writes plus other tabs ("storage" event).
const listeners = new Set<() => void>();

export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

export function readRaw(store: StoreName, key: string): string | null {
  try {
    return stores[store]().getItem(key);
  } catch {
    return null;
  }
}

export function parse<T>(raw: string | null | undefined, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function read<T>(store: StoreName, key: string, fallback: T): T {
  return parse(readRaw(store, key), fallback);
}

function write(store: StoreName, key: string, value: unknown): void {
  try {
    stores[store]().setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode, quota): the app still works without it.
  }
  listeners.forEach((l) => l());
}

export type Theme = "light" | "dark";

export function parseTheme(raw: string | null | undefined): Theme | null {
  const t = parse<unknown>(raw, null);
  return t === "light" || t === "dark" ? t : null;
}

/** null: follow the system. */
export function saveTheme(theme: Theme | null): void {
  if (theme) return write(local, THEME_KEY, theme);
  try {
    stores[local]().removeItem(THEME_KEY);
  } catch {
    // Nothing stored to remove.
  }
  listeners.forEach((l) => l());
}

export function parseLastSearch(raw: string | null | undefined): SearchFilters | undefined {
  const q = parse<string | null>(raw, null);
  return q === null ? undefined : fromQuery(q);
}

export function saveLastSearch(f: SearchFilters): void {
  write(local, LAST_KEY, toQuery(f));
}

export function parseSaved(raw: string | null | undefined): SavedSearch[] {
  const list = parse<SavedSearch[]>(raw, []);
  return Array.isArray(list) ? list : [];
}

function loadSaved(): SavedSearch[] {
  return parseSaved(readRaw(local, SAVED_KEY));
}

function storeSaved(list: SavedSearch[]): void {
  write(local, SAVED_KEY, list);
}

export function addSaved(name: string, f: SearchFilters): SavedSearch {
  const item: SavedSearch = {
    id: crypto.randomUUID(),
    name,
    query: toQuery(f),
    createdAt: new Date().toISOString(),
  };
  storeSaved([item, ...loadSaved()]);
  return item;
}

export function updateSaved(id: string, patch: Partial<Omit<SavedSearch, "id">>): void {
  storeSaved(loadSaved().map((s) => (s.id === id ? { ...s, ...patch } : s)));
}

export function removeSaved(id: string): void {
  storeSaved(loadSaved().filter((s) => s.id !== id));
}

/** Marks saved searches with the same query as just run. */
export function markRun(query: string): void {
  const list = loadSaved();
  if (list.some((s) => s.query === query)) {
    storeSaved(list.map((s) => (s.query === query ? { ...s, lastRunAt: new Date().toISOString() } : s)));
  }
}

/** Links opened per search query in this browser session. */
export function parseOpened(raw: string | null | undefined, query: string): string[] {
  return parse<Record<string, string[]>>(raw, {})[query] ?? [];
}

export function addOpened(query: string, url: string): void {
  const all = read<Record<string, string[]>>(session, OPENED_KEY, {});
  write(session, OPENED_KEY, { ...all, [query]: [...new Set([...(all[query] ?? []), url])] });
}

export function parseCars(raw: string | null | undefined): SavedCar[] {
  const list = parse<SavedCar[]>(raw, []);
  return Array.isArray(list) ? list.filter((c) => c && typeof c.id === "string" && c.input) : [];
}

function loadCars(): SavedCar[] {
  return parseCars(readRaw(local, CARS_KEY));
}

export function addCar(car: Omit<SavedCar, "id" | "addedAt">): SavedCar {
  const item: SavedCar = { ...car, id: crypto.randomUUID(), addedAt: new Date().toISOString() };
  write(local, CARS_KEY, [item, ...loadCars()]);
  return item;
}

export function updateCar(id: string, patch: Partial<Omit<SavedCar, "id">>): void {
  write(local, CARS_KEY, loadCars().map((c) => (c.id === id ? { ...c, ...patch } : c)));
}

export function removeCar(id: string): void {
  write(local, CARS_KEY, loadCars().filter((c) => c.id !== id));
}

/** Saved searches and cars as a file the user can keep and load into another browser. */
export interface Backup {
  app: "cargregator";
  version: 1;
  saved: SavedSearch[];
  cars: SavedCar[];
}

export function exportBackup(): Backup {
  return { app: "cargregator", version: 1, saved: loadSaved(), cars: loadCars() };
}

const isSavedSearch = (s: unknown): s is SavedSearch => {
  const x = s as SavedSearch;
  return Boolean(x) && typeof x.id === "string" && typeof x.name === "string" && typeof x.query === "string" && typeof x.createdAt === "string";
};

/** Adds the backup's entries whose ids aren't stored yet; null when the data isn't a backup. */
export function mergeBackup(
  current: { saved: SavedSearch[]; cars: SavedCar[] },
  data: unknown,
): { saved: SavedSearch[]; cars: SavedCar[]; added: number } | null {
  const b = data as Partial<Backup> | null;
  if (!b || b.app !== "cargregator" || !Array.isArray(b.saved) || !Array.isArray(b.cars)) return null;
  const savedIds = new Set(current.saved.map((s) => s.id));
  const carIds = new Set(current.cars.map((c) => c.id));
  const saved = b.saved.filter(isSavedSearch).filter((s) => !savedIds.has(s.id));
  const cars = parseCars(JSON.stringify(b.cars)).filter((c) => !carIds.has(c.id));
  return { saved: [...current.saved, ...saved], cars: [...current.cars, ...cars], added: saved.length + cars.length };
}

/** Loads a backup file's contents; the number of entries added, or null when it isn't a backup. */
export function importBackup(json: string): number | null {
  const merged = mergeBackup({ saved: loadSaved(), cars: loadCars() }, parse<unknown>(json, null));
  if (!merged) return null;
  storeSaved(merged.saved);
  write(local, CARS_KEY, merged.cars);
  return merged.added;
}
