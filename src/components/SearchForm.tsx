"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookmarkPlus, CarFront, ChevronDown, LocateFixed, MapPin, Navigation, Radar, RotateCcw, Search, SlidersHorizontal,
} from "lucide-react";
import { CITIES, findCity } from "@/data/cities";
import { MAKES, findMake } from "@/data/makes";
import {
  BODIES, DEFAULT_FILTERS, FUELS, GEARBOXES, RADIUS_MAX, RADIUS_MIN, RADIUS_STEP, SELLERS, SORTS,
  fromQuery, hpToKw, kwToHp, sanitize, toQuery, type SearchFilters, type SiteId,
} from "@/lib/filters";
import { nearestCity } from "@/lib/geo";
import { formatNumber, t, type Dict, type Locale } from "@/lib/i18n";
import { SITES, isInRange, linkContext, marketCode, radiusToReach } from "@/lib/sites/registry";
import { LAST_KEY, addSaved, parseLastSearch, saveLastSearch } from "@/lib/storage";
import { useStored } from "@/lib/useStored";
import { summarize } from "@/lib/summary";
import { Card, Chip, CountryCode, Eyebrow, Field, NumberInput, Pill, Segmented, Select, Toast, button } from "./ui";
import { CarInfoHint } from "@/components/CarInfoCard";
import { CarSearch } from "@/components/CarSearch";

const COUNTRY_ORDER = ["SI", "AT", "DE", "HR", "IT", "HU", "BE", "NL", "LU", "FR", "ES"];
const YEAR_NOW = new Date().getFullYear();
const MILEAGE_PRESETS = [50_000, 100_000, 150_000, 200_000];
const RADIUS_TICKS = [RADIUS_MIN, 250, 500, 750, RADIUS_MAX];

/** Picks the starting filters, then (re)mounts the form with them. */
export function SearchForm({ lang, dict }: { lang: Locale; dict: Dict }) {
  const params = useSearchParams();
  const lastRaw = useStored("local", LAST_KEY);
  // A query in the URL ("Edit search") wins over the last search kept in this browser.
  const fromUrl = params.size > 0;
  const initial = useMemo(
    () => (fromUrl ? fromQuery(params) : (parseLastSearch(lastRaw) ?? DEFAULT_FILTERS)),
    [fromUrl, params, lastRaw],
  );
  return <Form key={fromUrl ? params.toString() : (lastRaw ?? "")} initial={initial} lang={lang} dict={dict} />;
}

function Form({ initial, lang, dict }: { initial: SearchFilters; lang: Locale; dict: Dict }) {
  const router = useRouter();
  const [f, setF] = useState<SearchFilters>(initial);
  const [powerUnit, setPowerUnit] = useState<"kw" | "hp">("kw");
  const [moreOpen, setMoreOpen] = useState(false);
  const [locating, setLocating] = useState<"idle" | "busy" | "error">("idle");
  const [toast, setToast] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(false), 1200);
    return () => clearTimeout(id);
  }, [flash]);

  const set = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) =>
    setF((prev) => ({ ...prev, [key]: value }));
  const toggle = <K extends "fuel" | "body">(key: K, value: NonNullable<SearchFilters[K]>[number]) =>
    setF((prev) => {
      const list = (prev[key] ?? []) as string[];
      return { ...prev, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] };
    });

  const make = findMake(f.makeId);
  const ctx = useMemo(() => linkContext(f), [f]);
  const inRangeCount = SITES.filter((s) => isInRange(s, ctx)).length;
  const searchable = SITES.filter((s) => f.sites.includes(s.id) && isInRange(s, ctx));
  const moreCount = [f.powerFromKw, f.fuel?.length, f.body?.length, f.gearbox, f.seller].filter(Boolean).length;

  const citiesByCountry = useMemo(
    () => COUNTRY_ORDER.map((c) => ({ country: c, cities: CITIES.filter((x) => x.country === c) })),
    [],
  );

  function useMyLocation() {
    if (!("geolocation" in navigator)) return setLocating("error");
    setLocating("busy");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("cityId", nearestCity({ lat: pos.coords.latitude, lon: pos.coords.longitude }).id);
        setLocating("idle");
      },
      () => setLocating("error"),
      { timeout: 10_000, maximumAge: 600_000 },
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = sanitize(f);
    saveLastSearch(clean);
    router.push(`/${lang}/results/?${toQuery(clean)}`);
  }

  function save() {
    const clean = sanitize(f);
    addSaved(summarize(clean, dict, lang), clean);
    setToast(dict.results.savedToast);
  }

  const reset = () => setF({ ...DEFAULT_FILTERS, cityId: f.cityId });
  const powerValue = f.powerFromKw === undefined ? undefined : powerUnit === "hp" ? kwToHp(f.powerFromKw) : f.powerFromKw;
  const submitLabel =
    searchable.length === 0
      ? dict.search.noSites
      : searchable.length === 1
        ? dict.search.submitOne
        : t(dict.search.submit, { n: searchable.length });
  const km = (n: number) => `${formatNumber(n, lang)} km`;

  return (
    <form onSubmit={submit} className="space-y-6 pb-12 lg:pb-0">
      <div>
        <Eyebrow className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden />
          <span className="text-accent">{t(dict.search.eyebrow, { n: SITES.length })}</span>
          <span aria-hidden>·</span>
          <span>SI · AT · DE · HR · EU</span>
        </Eyebrow>
        <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight sm:text-4xl">{dict.search.title}</h1>
        <p className="mt-2 max-w-2xl text-muted sm:text-lg">{dict.search.subtitle}</p>
        <div className="mt-5 max-w-xl">
          <CarSearch
            dict={dict}
            label={dict.search.quickTitle}
            placeholder={dict.search.quickPlaceholder}
            noResults={dict.search.quickNoResults}
            clearOnPick
            onPick={(hit) => {
              setF((p) => ({ ...p, makeId: hit.make.id, modelId: hit.model?.id }));
              setFlash(true);
            }}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
        <div className="space-y-6">
          <Card title={dict.search.vehicle} icon={CarFront} aside={<Eyebrow className="hidden sm:inline">01 / 03</Eyebrow>}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={dict.search.make} htmlFor="make">
                <div className={flash ? "rounded-[10px] ring-2 ring-accent transition-shadow" : "rounded-[10px] transition-shadow"}>
                  <Select
                    id="make"
                    value={f.makeId ?? ""}
                    onChange={(e) => setF((p) => ({ ...p, makeId: e.target.value || undefined, modelId: undefined }))}
                  >
                    <option value="">{dict.search.anyMake}</option>
                    {MAKES.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </Select>
                </div>
              </Field>
              <Field label={dict.search.model} htmlFor="model">
                <div className={flash ? "rounded-[10px] ring-2 ring-accent transition-shadow" : "rounded-[10px] transition-shadow"}>
                  <Select id="model" value={f.modelId ?? ""} disabled={!make} onChange={(e) => set("modelId", e.target.value || undefined)}>
                    <option value="">{dict.search.anyModel}</option>
                    {make?.models.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </Select>
                </div>
                {f.makeId && f.modelId && <CarInfoHint lang={lang} dict={dict} makeId={f.makeId} modelId={f.modelId} />}
              </Field>
              <RangeField label={dict.search.year}
                from={<NumberInput aria-label={`${dict.search.year} ${dict.search.from}`} placeholder={dict.search.from} min={1950} max={YEAR_NOW} value={f.yearFrom} onValue={(v) => set("yearFrom", v)} />}
                to={<NumberInput aria-label={`${dict.search.year} ${dict.search.to}`} placeholder={dict.search.to} min={1950} max={YEAR_NOW} value={f.yearTo} onValue={(v) => set("yearTo", v)} />}
              />
              <RangeField label={dict.search.price}
                from={<NumberInput aria-label={`${dict.search.price} ${dict.search.from}`} placeholder={dict.search.from} min={0} step={500} unit="€" value={f.priceFrom} onValue={(v) => set("priceFrom", v)} />}
                to={<NumberInput aria-label={`${dict.search.price} ${dict.search.to}`} placeholder={dict.search.to} min={0} step={500} unit="€" value={f.priceTo} onValue={(v) => set("priceTo", v)} />}
              />
              <div className="sm:col-span-2">
                <Field label={dict.search.mileage} htmlFor="mileage">
                  <div className="flex flex-wrap items-center gap-2">
                    <NumberInput id="mileage" min={0} step={10000} unit="km" className="sm:max-w-48" value={f.mileageTo} onValue={(v) => set("mileageTo", v)} />
                    <div className="grid flex-1 grid-cols-4 gap-1.5 sm:flex sm:flex-none" role="group" aria-label={dict.search.mileage}>
                      {MILEAGE_PRESETS.map((v) => (
                        <button
                          key={v}
                          type="button"
                          aria-pressed={f.mileageTo === v}
                          onClick={() => set("mileageTo", f.mileageTo === v ? undefined : v)}
                          className={`h-9 rounded-lg px-3 font-mono text-[12px] font-medium transition-colors ${
                            f.mileageTo === v ? "bg-accent text-accent-foreground" : "bg-surface-low hover:bg-surface"
                          }`}
                        >
                          {v / 1000}k
                        </button>
                      ))}
                    </div>
                  </div>
                </Field>
              </div>
              <Field label={dict.search.sort} htmlFor="sort">
                <Select
                  id="sort"
                  value={f.sort ?? "newest"}
                  onChange={(e) => set("sort", e.target.value === "newest" ? undefined : (e.target.value as SearchFilters["sort"]))}
                >
                  {SORTS.map((x) => (
                    <option key={x} value={x}>{dict.sort[x]}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </Card>

          <Card
            title={dict.search.technical}
            icon={SlidersHorizontal}
            aside={
              <span className="flex items-center gap-2">
                {moreCount > 0 && <Pill tone="accent">{t(dict.search.activeCount, { n: moreCount })}</Pill>}
                <Eyebrow className="hidden sm:inline">02 / 03</Eyebrow>
              </span>
            }
          >
            {/* Phones: folded away until asked for; wide screens always show it. */}
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              aria-expanded={moreOpen}
              className="-mt-1 flex min-h-9 items-center gap-1 text-sm font-medium text-accent lg:hidden"
            >
              {moreOpen ? dict.search.fewerFilters : dict.search.moreFilters}
              <ChevronDown className={`size-4 transition-transform ${moreOpen ? "rotate-180" : ""}`} aria-hidden />
            </button>
            <div className={`space-y-5 ${moreOpen ? "mt-4 lg:mt-0" : "hidden lg:block"}`}>
              <Field label={dict.search.power} htmlFor="power">
                <div className="flex gap-2 sm:max-w-sm">
                  <NumberInput
                    id="power"
                    min={0}
                    className="flex-1"
                    value={powerValue}
                    onValue={(v) => set("powerFromKw", v === undefined ? undefined : powerUnit === "hp" ? hpToKw(v) : v)}
                  />
                  <Segmented
                    label={dict.search.power}
                    value={powerUnit}
                    onChange={(u) => setPowerUnit(u as "kw" | "hp")}
                    options={[{ value: "kw", label: "kW" }, { value: "hp", label: lang === "sl" ? "KM" : "hp" }]}
                  />
                </div>
              </Field>
              <ChipGroup label={dict.search.fuel}>
                {FUELS.map((x) => (
                  <Chip key={x} pressed={f.fuel?.includes(x) ?? false} onClick={() => toggle("fuel", x)}>{dict.fuel[x]}</Chip>
                ))}
              </ChipGroup>
              <ChipGroup label={dict.search.body}>
                {BODIES.map((x) => (
                  <Chip key={x} pressed={f.body?.includes(x) ?? false} onClick={() => toggle("body", x)}>{dict.body[x]}</Chip>
                ))}
              </ChipGroup>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={dict.search.gearbox}>
                  <Segmented
                    full
                    label={dict.search.gearbox}
                    value={f.gearbox ?? ""}
                    onChange={(v) => set("gearbox", (v || undefined) as SearchFilters["gearbox"])}
                    options={[{ value: "", label: dict.search.any }, ...GEARBOXES.map((g) => ({ value: g, label: dict.gearbox[g] }))]}
                  />
                </Field>
                <Field label={dict.search.seller}>
                  <Segmented
                    full
                    label={dict.search.seller}
                    value={f.seller ?? ""}
                    onChange={(v) => set("seller", (v || undefined) as SearchFilters["seller"])}
                    options={[{ value: "", label: dict.search.any }, ...SELLERS.map((s) => ({ value: s, label: dict.seller[s] }))]}
                  />
                </Field>
              </div>
            </div>
          </Card>

          <Card title={dict.search.location} icon={Navigation} aside={<Eyebrow className="hidden sm:inline">03 / 03</Eyebrow>}>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <Field label={dict.search.city} htmlFor="city">
                <Select id="city" value={f.cityId} onChange={(e) => set("cityId", e.target.value)}>
                  {citiesByCountry.map(({ country, cities }) => (
                    <optgroup key={country} label={dict.countries[country as keyof Dict["countries"]]}>
                      {cities.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
              </Field>
              <button type="button" onClick={useMyLocation} disabled={locating === "busy"} className={button("soft")}>
                <LocateFixed className="size-4" aria-hidden />
                {locating === "busy" ? dict.search.locating : dict.search.useMyLocation}
              </button>
            </div>
            {locating === "error" && <p className="mt-2 text-sm text-warning" role="alert">{dict.search.locationError}</p>}
            <div className="mt-4 rounded-xl bg-surface-low p-4">
              <div className="flex items-baseline justify-between">
                <label htmlFor="radius" className="text-[13px] font-medium text-muted">{dict.search.radius}</label>
                <span className="font-mono text-xl font-semibold text-accent">
                  {f.radiusKm} <span className="text-sm">km</span>
                </span>
              </div>
              <input
                id="radius"
                type="range"
                min={RADIUS_MIN}
                max={RADIUS_MAX}
                step={RADIUS_STEP}
                value={f.radiusKm}
                onChange={(e) => set("radiusKm", Number(e.target.value))}
                className="mt-3 w-full"
              />
              <div className="mt-1 flex justify-between font-mono text-[11px] text-subtle" aria-hidden>
                {RADIUS_TICKS.map((r) => (
                  <span key={r}>{r} km</span>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <Card
            title={dict.search.sites}
            icon={Radar}
            aside={<Pill tone="info">{t(dict.search.inRange, { n: inRangeCount, total: SITES.length })}</Pill>}
          >
            <ul className="space-y-2">
              {SITES.map((s) => {
                const inRange = isInRange(s, ctx);
                const checked = f.sites.includes(s.id);
                const reach = inRange ? undefined : radiusToReach(s, ctx.city);
                return (
                  <li key={s.id} className={`rounded-xl border ${inRange ? "border-border" : "border-dashed border-border-strong"}`}>
                    <label className="flex min-h-14 cursor-pointer items-center gap-3 px-3 py-2.5">
                      <input
                        type="checkbox"
                        className="size-[18px] shrink-0 accent-[var(--accent)]"
                        checked={checked}
                        onChange={() =>
                          set("sites", checked ? f.sites.filter((x) => x !== s.id) : [...f.sites, s.id as SiteId])
                        }
                      />
                      <span className={`min-w-0 flex-1 ${inRange ? "" : "opacity-60"}`}>
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <CountryCode code={marketCode(s)} />
                          <span className="font-semibold">{s.name}</span>
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">{dict.search.siteLocation[s.location]}</span>
                      </span>
                      <span className="shrink-0">
                        {inRange ? (
                          <Pill tone={s.location === "exact" ? "success" : "info"} dot>
                            {s.location === "exact" ? t(dict.search.exactPill, { radius: f.radiusKm }) : dict.search.inRangePill}
                          </Pill>
                        ) : (
                          <Pill tone="warning">{dict.search.outOfRange}</Pill>
                        )}
                      </span>
                    </label>
                    {reach && (
                      <button
                        type="button"
                        onClick={() => set("radiusKm", reach)}
                        className="mx-3 mb-2.5 -mt-1 text-xs font-medium text-accent hover:underline"
                      >
                        {t(dict.search.expandRadius, { radius: km(reach) })}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="mt-5 hidden space-y-3 border-t border-border pt-5 lg:block">
              <button type="submit" disabled={searchable.length === 0} className={button("primary", { className: "h-12 w-full text-base" })}>
                <Search className="size-5" aria-hidden />
                {submitLabel}
              </button>
              <div className="flex items-center justify-between">
                <button type="button" onClick={reset} className={button("ghost", { small: true })}>
                  <RotateCcw className="size-4" aria-hidden />
                  {dict.search.reset}
                </button>
                <button type="button" onClick={save} className={button("ghost", { small: true })}>
                  <BookmarkPlus className="size-4" aria-hidden />
                  {dict.search.save}
                </button>
              </div>
              <p className="text-center text-xs text-subtle">{dict.search.submitNote}</p>
            </div>
          </Card>
          <p className="flex items-start gap-2 rounded-xl bg-surface-low p-4 text-xs text-muted">
            <MapPin className="mt-px size-4 shrink-0 text-accent" aria-hidden />
            {t(dict.search.locationNote, { city: findCity(f.cityId)?.name ?? "" })}
          </p>
        </aside>
      </div>

      {/* Phones and tablets: actions stay in reach above the tab bar. */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 border-t border-border bg-card/95 px-4 py-3 backdrop-blur sm:bottom-0 lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <button type="button" onClick={reset} className={button("ghost", { className: "px-3" })}>
            <RotateCcw className="size-4" aria-hidden />
            <span className="sr-only">{dict.search.reset}</span>
          </button>
          <button type="button" onClick={save} className={button("ghost", { className: "px-3" })}>
            <BookmarkPlus className="size-4" aria-hidden />
            <span className="sr-only">{dict.search.save}</span>
          </button>
          <button type="submit" disabled={searchable.length === 0} className={button("primary", { className: "h-12 flex-1 text-[15px]" })}>
            <Search className="size-5" aria-hidden />
            {submitLabel}
          </button>
        </div>
      </div>
      <Toast message={toast} />
    </form>
  );
}

function RangeField({ label, from, to }: { label: string; from: ReactNode; to: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-[13px] font-medium text-muted">{label}</legend>
      <div className="flex items-center gap-2">
        {from}
        <span className="text-subtle" aria-hidden>–</span>
        {to}
      </div>
    </fieldset>
  );
}

function ChipGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 text-[13px] font-medium text-muted">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}
