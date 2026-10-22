"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle, ArrowLeft, BadgeCheck, BookmarkPlus, CarFront, ClipboardCheck, ExternalLink, FileText, Info, Landmark,
  Link2, Receipt, Truck, Wallet, X, Zap, type LucideIcon,
} from "lucide-react";
import { CO2_LOADERS } from "@/data/co2";
import { MAKES, findMake, findModel } from "@/data/makes";
import {
  co2Overridden, effectiveCycle, evaluateCar, findCo2, firstRegistration, initialCarInput, isHybrid, resolveCar, withListing,
  type CarCountry, type CarInput,
} from "@/lib/carInput";
import { euroByRegistration, kwTolerance, listEngines, lookupCo2, type Co2Data, type Engine } from "@/lib/co2";
import { EURO_NORMS, calculateDmv } from "@/lib/dmv";
import { FUELS, fromQuery, hpToKw, kwToHp, type Fuel, type SearchFilters } from "@/lib/filters";
import { formatEur, formatNumber, t, type Dict, type Locale } from "@/lib/i18n";
import { SELLER_COUNTRIES, isNewForVat } from "@/lib/landedCost";
import { parseListing, type ListingInfo } from "@/lib/listing";
import { findSite } from "@/lib/sites/registry";
import { CARS_KEY, addCar, parseCars, updateCar, type SavedCar } from "@/lib/storage";
import { useStored } from "@/lib/useStored";
import { MyCars } from "./MyCars";
import { Checkbox, Eyebrow, Field, NumberInput, Pill, Segmented, Select, button, inputClass } from "./ui";
import { CarInfoPanel } from "@/components/CarInfoCard";

const YEAR_NOW = new Date().getFullYear();
const YEARS = Array.from({ length: YEAR_NOW - 1989 }, (_, i) => YEAR_NOW - i);
/** Engines shown before "Show all". */
const ENGINES_SHOWN = 4;
const GUIDE_ICONS: LucideIcon[] = [ClipboardCheck, FileText, Truck, BadgeCheck, Landmark, CarFront];

/**
 * Without a car in the URL: the "My cars" list. With a shared link (?u, ?tx, ?ti), a saved car (?car) or
 * ?manual: the calculator, prefilled from the search and the link.
 */
export function CheckCar({ lang, dict }: { lang: Locale; dict: Dict }) {
  const params = useSearchParams();
  const filters = useMemo(() => fromQuery(params), [params]);
  const shared = params.has("u") || params.has("tx") || params.has("ti");
  const listing = useMemo(
    () => (shared ? parseListing({ url: params.get("u"), text: params.get("tx"), title: params.get("ti") }) : null),
    [params, shared],
  );
  const carId = params.get("car");
  const carsRaw = useStored("local", CARS_KEY);

  if (carId) {
    if (carsRaw === undefined) return null;
    const car = parseCars(carsRaw).find((x) => x.id === carId);
    if (!car) return <MyCars lang={lang} dict={dict} notice={dict.check.carNotFound} />;
    return <Form key={car.id} filters={filters} saved={car} lang={lang} dict={dict} />;
  }
  if (listing || params.has("manual")) {
    return <Form key={params.toString()} filters={filters} listing={listing} lang={lang} dict={dict} />;
  }
  return <MyCars lang={lang} dict={dict} notice={shared ? dict.cars.badLink : undefined} />;
}

function Form({
  filters,
  listing,
  saved,
  lang,
  dict,
}: {
  filters: SearchFilters;
  listing?: ListingInfo | null;
  saved?: SavedCar;
  lang: Locale;
  dict: Dict;
}) {
  const c = dict.check;
  const router = useRouter();
  const [s, setS] = useState<CarInput>(() => saved?.input ?? initialCarInput(filters, listing));
  const set = <K extends keyof CarInput>(key: K, value: CarInput[K]) => setS((prev) => ({ ...prev, [key]: value }));
  const [powerUnit, setPowerUnit] = useState<"kw" | "hp">("kw");
  const [editingEmissions, setEditingEmissions] = useState(false);

  const make = findMake(s.makeId);
  const carName = make ? [make.name, findModel(s.makeId, s.modelId)?.name].filter(Boolean).join(" ") : undefined;
  // The listing link can be added, replaced or removed on the form.
  const [link, setLink] = useState(() => (saved ? { url: saved.url, site: saved.site } : { url: listing?.url, site: listing?.site }));
  const [added, setAdded] = useState<ListingInfo | null>(null);
  const [linkText, setLinkText] = useState("");
  const [linkError, setLinkError] = useState(false);
  const { url, site } = link;
  const siteName = site ? findSite(site).name : url ? new URL(url).hostname.replace(/^www\./, "") : undefined;
  const [title, setTitle] = useState(() => saved?.title ?? listing?.title ?? "");

  // EU registration figures, loaded per make.
  const [co2Data, setCo2Data] = useState<{ makeId: string; data: Co2Data } | null>(null);
  const loader = s.makeId ? CO2_LOADERS[s.makeId] : undefined;
  useEffect(() => {
    if (!loader || !s.makeId) return;
    const makeId = s.makeId;
    let live = true;
    loader().then((data) => live && setCo2Data({ makeId, data }));
    return () => {
      live = false;
    };
  }, [loader, s.makeId]);
  const data = co2Data && co2Data.makeId === s.makeId ? co2Data.data : undefined;
  const loading = Boolean(loader) && !data;

  const now = new Date();
  // Until the data has loaded, a saved car keeps the figures it was saved with.
  const auto = data ? findCo2(s, data, now) : loading ? saved?.auto : undefined;
  // What the tax uses and the form shows: the user's values, the rest filled in.
  const e = resolveCar(s, auto, now);
  /** Changing CO2 or its cycle keeps the other one as currently shown. */
  const overrideCo2 = <K extends "co2" | "cycle">(key: K, value: CarInput[K]) =>
    setS((prev) => ({ ...prev, co2: prev.co2 ?? e.co2, cycle: prev.cycle ?? e.cycle, [key]: value }));
  const resetAuto = () => {
    setS((prev) => ({ ...prev, co2: undefined, co2Unknown: false, cycle: undefined, euro: "", dieselHybrid: undefined }));
    setEditingEmissions(false);
  };
  const pickEngine = (engine: Engine) => {
    setS((prev) => ({
      ...prev, fuel: engine.fuel, kw: engine.kw, co2: undefined, co2Unknown: false, cycle: undefined, euro: "", dieselHybrid: undefined,
    }));
    setEditingEmissions(false);
  };

  const firstReg = firstRegistration(e);
  const cycle = effectiveCycle(e);
  const electric = e.fuel === "electric";
  const domestic = e.country === "SI";
  const newForVat = !domestic && firstReg !== null && isNewForVat(firstReg, e.km, now);
  const evaluated = evaluateCar(e, now);
  const result = evaluated.kind === "import" ? evaluated.cost : null;
  const total = result ? result.total : evaluated.kind === "domestic" ? evaluated.total : null;

  const customised = co2Overridden(s) || s.euro !== "" || s.dieselHybrid !== undefined;
  const needsInput = !s.modelId || !s.kw || (!s.regYear && !s.isNew);
  const noData = !auto && !needsInput && !loading;
  // The CO2 and Euro norm fields: when asked for, when the user set something, or when there's no data to use.
  const showFields = editingEmissions || co2Overridden(s) || noData;
  const co2Source = co2Overridden(s)
    ? undefined
    : auto
      ? t(auto.powerMatched ? c.autoFrom : c.autoFromAnyPower, {
          car: carName ?? "",
          fuel: dict.fuel[e.fuel].toLowerCase(),
          kw: s.kw ?? "",
          year: auto.year,
          cars: formatNumber(auto.cars, lang),
        })
      : needsInput
        ? c.autoNeedsInput
        : noData
          ? c.autoNoData
          : undefined;

  const eur = (n: number) => formatEur(n, lang);
  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(2000, i, 1).toLocaleDateString(lang === "sl" ? "sl-SI" : "en-GB", { month: "short" }),
  );
  const listFormat = new Intl.ListFormat(lang === "sl" ? "sl-SI" : "en-GB");
  const missingText =
    evaluated.kind === "missing" ? t(c.missing, { list: listFormat.format(evaluated.missing.map((k) => c.missingNames[k])) }) : "";
  const linked = added ?? (saved ? null : listing);
  const fromLink = linked
    ? [
        linked.country && dict.countries[linked.country as keyof Dict["countries"]],
        linked.makeId && carName,
        linked.fuel && dict.fuel[linked.fuel],
        linked.price !== undefined && eur(linked.price),
      ].filter((x): x is string => Boolean(x))
    : [];
  const searched = !linked && !saved ? initialCarInput(filters) : undefined;
  const fromSearch = searched
    ? [
        searched.makeId && [findMake(searched.makeId)?.name, findModel(searched.makeId, searched.modelId)?.name].filter(Boolean).join(" "),
        filters.fuel?.length === 1 && dict.fuel[searched.fuel],
        searched.regYear && String(searched.regYear),
        searched.price !== undefined && eur(searched.price),
        searched.km !== undefined && `${formatNumber(searched.km, lang)} km`,
        searched.kw !== undefined && `${searched.kw} kW`,
      ].filter((x): x is string => Boolean(x))
    : [];
  const powerValue = s.kw === undefined ? undefined : powerUnit === "hp" ? kwToHp(s.kw) : s.kw;
  const hp = lang === "sl" ? "KM" : c.hp;
  const rows = data && s.modelId ? data[s.modelId] : undefined;
  const showPicker = !domestic && Boolean(s.modelId) && (loading || listEngines(rows).length > 0);
  const overhead = result && s.price !== undefined ? result.total - s.price : undefined;

  function save() {
    const name = title.trim() || carName || siteName || dict.cars.untitled;
    if (saved) updateCar(saved.id, { title: name, url, site, input: s, auto });
    else addCar({ title: name, url, site, input: s, auto });
    router.push(`/${lang}/check/`);
  }

  function addLink(ev: React.FormEvent) {
    ev.preventDefault();
    const info = parseListing({ text: linkText });
    if (!info) {
      setLinkError(true);
      return;
    }
    setS((prev) => withListing(prev, info));
    setLink({ url: info.url, site: info.site });
    setAdded(info);
    setTitle((prev) => prev || info.title || "");
    setLinkText("");
  }

  function removeLink() {
    setLink({ url: undefined, site: undefined });
    setAdded(null);
  }

  let step = 0;
  const nextStep = () => String(++step).padStart(2, "0");

  return (
    <div className="space-y-6 pb-16 lg:pb-0">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link href={`/${lang}/check/`} className="mb-3 inline-flex min-h-9 items-center gap-1.5 text-sm text-muted hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden />
            {c.backToCars}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-accent px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-accent-foreground">
              {c.eyebrow}
            </span>
            <Eyebrow>ZDMV-1</Eyebrow>
          </div>
          <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight sm:text-4xl">{c.title}</h1>
          <p className="mt-2 max-w-2xl text-muted">{c.subtitle}</p>
        </div>
        {(carName || url) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-surface-low px-4 py-3 text-sm">
            <CarFront className="size-4 text-muted" aria-hidden />
            <span className="font-semibold">{carName ?? siteName}</span>
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-accent hover:underline">
                {siteName && carName ? `${siteName} · ` : ""}{c.openListing}
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            )}
          </div>
        )}
      </div>
      {fromLink.length > 0 && <p className="-mt-2 text-sm text-muted">{t(c.fromLink, { list: fromLink.join(", ") })}</p>}
      {fromSearch.length > 0 && <p className="-mt-2 text-sm text-muted">{t(c.fromSearch, { list: fromSearch.join(", ") })}</p>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6 lg:col-start-1">
          <Section n={nextStep()} title={c.vehicleSection}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label={c.name} htmlFor="name">
                  <input
                    id="name"
                    value={title}
                    maxLength={120}
                    placeholder={carName ?? dict.cars.untitled}
                    onChange={(ev) => setTitle(ev.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label={c.make} htmlFor="make">
                <Select
                  id="make"
                  value={s.makeId ?? ""}
                  onChange={(ev) => setS((prev) => ({ ...prev, makeId: ev.target.value || undefined, modelId: undefined }))}
                >
                  <option value="">{c.chooseMake}</option>
                  {MAKES.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label={c.model} htmlFor="model">
                <Select id="model" value={s.modelId ?? ""} disabled={!make} onChange={(ev) => set("modelId", ev.target.value || undefined)}>
                  <option value="">{c.chooseModel}</option>
                  {make?.models.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </Select>
              </Field>
            </div>
            {showPicker && (
              <EnginePicker
                rows={rows}
                loading={loading}
                s={s}
                firstReg={firstReg}
                now={now}
                lang={lang}
                dict={dict}
                onPick={pickEngine}
              />
            )}
          </Section>

          <Section n={nextStep()} title={c.listing}>
            <div className="mb-4">
              {url ? (
                <div>
                  <p className="mb-1.5 text-[13px] font-medium text-muted">{dict.cars.linkLabel}</p>
                  <div className="flex items-center gap-2 rounded-lg bg-surface-low px-3 py-2 text-sm">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-w-0 flex-1 items-center gap-1.5 font-medium text-accent hover:underline"
                    >
                      <span className="truncate">{siteName ? `${siteName} · ${c.openListing}` : c.openListing}</span>
                      <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                    </a>
                    <button type="button" onClick={removeLink} className={button("ghost", { small: true })}>
                      <X className="size-4" aria-hidden />
                      {c.linkRemove}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={addLink}>
                  <label htmlFor="listing-link" className="mb-1.5 block text-[13px] font-medium text-muted">{dict.cars.linkLabel}</label>
                  <div className="flex gap-2">
                    <input
                      id="listing-link"
                      type="url"
                      inputMode="url"
                      value={linkText}
                      onChange={(ev) => {
                        setLinkText(ev.target.value);
                        setLinkError(false);
                      }}
                      placeholder="https://…"
                      aria-invalid={linkError || undefined}
                      aria-describedby={linkError ? "listing-link-error" : "listing-link-hint"}
                      className={`${inputClass} min-w-0 flex-1 font-mono text-sm`}
                    />
                    <button type="submit" disabled={!linkText.trim()} className={button("secondary")}>
                      <Link2 className="size-4" aria-hidden />
                      {c.linkAdd}
                    </button>
                  </div>
                  {linkError ? (
                    <p id="listing-link-error" className="mt-2 text-sm text-warning">{dict.cars.badLink}</p>
                  ) : (
                    <p id="listing-link-hint" className="mt-2 text-xs text-muted">{c.linkHint}</p>
                  )}
                </form>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={c.price} htmlFor="price">
                <NumberInput id="price" min={0} step={100} unit="EUR" value={s.price} onValue={(v) => set("price", v)} />
              </Field>
              <Field label={c.country} htmlFor="country">
                <Select id="country" value={s.country} onChange={(ev) => set("country", ev.target.value as CarCountry)}>
                  {SELLER_COUNTRIES.map((x) => (
                    <option key={x} value={x}>{dict.countries[x]}</option>
                  ))}
                  <option value="SI">{c.inSlovenia}</option>
                </Select>
              </Field>

              <fieldset>
                <legend className="mb-1.5 text-[13px] font-medium text-muted">{c.firstReg}</legend>
                <div className="flex gap-2">
                  <Select
                    aria-label={`${c.firstReg} ${c.month}`}
                    value={s.regMonth ?? ""}
                    disabled={s.isNew}
                    onChange={(ev) => set("regMonth", ev.target.value ? Number(ev.target.value) : undefined)}
                  >
                    <option value="">{c.month}</option>
                    {months.map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </Select>
                  <Select
                    aria-label={`${c.firstReg} ${c.year}`}
                    value={s.regYear ?? ""}
                    disabled={s.isNew}
                    onChange={(ev) => set("regYear", ev.target.value ? Number(ev.target.value) : undefined)}
                  >
                    <option value="">{c.year}</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </Select>
                </div>
                {!domestic && <Checkbox checked={s.isNew} onChange={(v) => set("isNew", v)}>{c.neverRegistered}</Checkbox>}
              </fieldset>
              <Field label={c.mileage} htmlFor="km">
                <NumberInput id="km" min={0} step={1000} unit="km" value={s.km} onValue={(v) => set("km", v)} />
              </Field>

              <Field label={c.fuel} htmlFor="fuel">
                <Select id="fuel" value={s.fuel} onChange={(ev) => set("fuel", ev.target.value as Fuel)}>
                  {FUELS.map((x) => (
                    <option key={x} value={x}>{dict.fuel[x]}</option>
                  ))}
                </Select>
              </Field>
              {!domestic && (
                <Field label={c.power} htmlFor="power">
                  <div className="flex gap-2">
                    <NumberInput
                      id="power"
                      min={0}
                      className="flex-1"
                      value={powerValue}
                      onValue={(v) => set("kw", v === undefined ? undefined : powerUnit === "hp" ? hpToKw(v) : v)}
                    />
                    <Segmented
                      label={c.power}
                      value={powerUnit}
                      onChange={(u) => setPowerUnit(u as "kw" | "hp")}
                      options={[{ value: "kw", label: "kW" }, { value: "hp", label: hp }]}
                    />
                  </div>
                </Field>
              )}
            </div>

            {!domestic && !electric && (
              <div className="mt-5 rounded-xl bg-surface-low p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[13px] font-medium text-muted">{c.autoTitle}</h3>
                    {!showFields && (e.co2 !== undefined || e.euro) && (
                      <p className="mt-1 font-mono text-[15px] font-semibold">
                        {[
                          e.co2 !== undefined && t(c.autoCo2, { g: e.co2, cycle: cycle.toUpperCase() }),
                          e.euro && c.euroNames[e.euro],
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                  {customised && (auto || !noData) ? (
                    <button type="button" onClick={resetAuto} className="min-h-9 shrink-0 text-sm font-medium text-accent hover:underline">
                      {c.useAuto}
                    </button>
                  ) : (
                    !showFields && (
                      <button type="button" onClick={() => setEditingEmissions(true)} className="min-h-9 shrink-0 text-sm font-medium text-accent hover:underline">
                        {c.change}
                      </button>
                    )
                  )}
                </div>
                {co2Source && <p className="mt-1 text-xs text-muted">{co2Source}</p>}
                {!showFields && s.euro === "" && !auto?.euro && e.euro && <p className="mt-1 text-xs text-muted">{c.autoEuroDate}</p>}

                {showFields && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field label={c.co2} htmlFor="co2">
                      <div className="flex gap-2">
                        <NumberInput
                          id="co2"
                          min={0}
                          max={999}
                          unit="g/km"
                          className="flex-1"
                          disabled={s.co2Unknown}
                          value={e.co2}
                          onValue={(v) => overrideCo2("co2", v)}
                        />
                        <Segmented
                          label={c.co2}
                          value={cycle}
                          onChange={(v) => overrideCo2("cycle", v as "wltp" | "nedc")}
                          options={[{ value: "wltp", label: "WLTP" }, { value: "nedc", label: "NEDC" }]}
                        />
                      </div>
                      <Checkbox checked={s.co2Unknown} onChange={(v) => set("co2Unknown", v)}>{c.co2Unknown}</Checkbox>
                      <Hint>{c.co2Hint}</Hint>
                    </Field>
                    <Field label={c.euro} htmlFor="euro">
                      <Select id="euro" value={e.euro} onChange={(ev) => set("euro", ev.target.value as CarInput["euro"])}>
                        <option value="" disabled>{c.euroSelect}</option>
                        {[...EURO_NORMS].reverse().map((x) => (
                          <option key={x} value={x}>{c.euroNames[x]}</option>
                        ))}
                        <option value="unknown">{c.euroNames.unknown}</option>
                      </Select>
                      <Hint>{c.euroHint}</Hint>
                    </Field>
                  </div>
                )}
              </div>
            )}

            {!domestic && (
              <div className="mt-4 space-y-1">
                {isHybrid(e.fuel) && (
                  <Checkbox checked={e.dieselHybrid ?? false} onChange={(v) => set("dieselHybrid", v)}>{c.dieselHybrid}</Checkbox>
                )}
                <Checkbox checked={s.eightPlusSeats} onChange={(v) => set("eightPlusSeats", v)}>{c.seats}</Checkbox>
                {newForVat && (
                  <Checkbox checked={s.vatShown} onChange={(v) => set("vatShown", v)}>{c.vatShown}</Checkbox>
                )}
              </div>
            )}
          </Section>

          {!domestic && (
            <Section n={nextStep()} title={c.otherCosts}>
              <div className="grid gap-3 sm:grid-cols-2">
                <CostField icon={Truck} id="transport" label={c.transport} hint={c.transportHint} value={e.transport} onValue={(v) => set("transport", v)} />
                <CostField icon={ClipboardCheck} id="registration" label={c.registration} hint={c.registrationHint} value={e.registration} onValue={(v) => set("registration", v)} />
              </div>
            </Section>
          )}
        </div>

        <aside className="space-y-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="space-y-4 lg:sticky lg:top-24">
            <section id="result" aria-live="polite" className="scroll-mt-20 overflow-hidden rounded-xl border border-border bg-card">
              <div className="p-4 sm:p-5">
                <Eyebrow className="flex items-center gap-2 text-accent">
                  <span className="size-1.5 rounded-full bg-accent" aria-hidden />
                  {c.resultEyebrow}
                </Eyebrow>
                <h2 className="mt-1 text-lg font-semibold">{c.resultTitle}</h2>
              </div>
              {evaluated.kind === "missing" ? (
                <p className="flex items-start gap-2 border-t border-border p-4 text-sm text-muted sm:p-5">
                  <Receipt className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {missingText}
                </p>
              ) : evaluated.kind === "domestic" ? (
                <>
                  <TotalBlock label={c.total} value={eur(evaluated.total)} />
                  <div className="p-4 text-sm sm:p-5">
                    <Note icon="info">{c.domesticNote}</Note>
                  </div>
                </>
              ) : (
                result && (
                  <>
                    <dl className="border-t border-border px-4 text-sm sm:px-5">
                      <Line label={result.newForVat && e.vatShown ? c.carPriceNet : c.carPrice} value={eur(result.carPrice)} />
                      {result.newForVat && <Line label={c.siVat} value={eur(result.siVat)} />}
                      <div className="my-2 rounded-lg bg-surface-low px-3">
                        <Line label={c.dmv} value={eur(result.dmv.total)} strong>
                          {electric ? (
                            <p>{c.dmvElectric}</p>
                          ) : (
                            <>
                              <BreakdownRow
                                label={result.dmv.co2Wltp === undefined ? c.dmvCo2Missing : t(c.dmvCo2, { g: result.dmv.co2Wltp })}
                                value={eur(result.dmv.co2Part)}
                              />
                              <BreakdownRow label={c.dmvEuro} value={eur(result.dmv.euroPart)} />
                              {result.dmv.seatsReduction && <BreakdownRow label={c.dmvSeats} />}
                              {result.dmv.yearsOver !== undefined && (
                                <BreakdownRow label={t(c.dmvAge, { pct: Math.round(result.dmv.ageShare * 100), band: c.ageBands[result.dmv.yearsOver] })} />
                              )}
                            </>
                          )}
                        </Line>
                      </div>
                      <Line label={c.transportLine} value={eur(result.transport)} />
                      <Line label={c.registrationLine} value={eur(result.registration)} />
                    </dl>
                    <TotalBlock label={c.total} value={eur(result.total)}>
                      {overhead !== undefined && s.price ? (
                        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-card px-3 py-2 font-mono text-[13px]">
                          <span className="text-muted">{c.overhead}</span>
                          <span className="font-semibold">
                            +{eur(overhead)} (+{formatNumber(Math.round((overhead / s.price) * 1000) / 10, lang)} %)
                          </span>
                        </div>
                      ) : null}
                    </TotalBlock>
                    {(result.newForVat || (!electric && (e.co2Unknown || e.euro === "unknown"))) && (
                      <div className="space-y-2 px-4 pt-4 text-sm sm:px-5">
                        {result.newForVat && <Note icon="info">{c.newForVatNote}</Note>}
                        {!electric && e.co2Unknown && <Note icon="warn">{c.co2Warning}</Note>}
                        {!electric && e.euro === "unknown" && <Note icon="warn">{c.euroWarning}</Note>}
                      </div>
                    )}
                  </>
                )
              )}
              <div className="p-4 sm:p-5">
                {!domestic && (
                  <p className="flex items-start gap-2 text-xs text-muted">
                    <Info className="mt-px size-3.5 shrink-0" aria-hidden />
                    {c.disclaimer}
                  </p>
                )}
                <button type="button" onClick={save} className={button("primary", { className: "mt-4 w-full" })}>
                  <BookmarkPlus className="size-4" aria-hidden />
                  {saved ? c.saveChanges : c.saveCar}
                </button>
              </div>
            </section>
            {!domestic && !electric && (
              <div className="flex items-start gap-3 rounded-xl bg-surface-low p-4 text-sm">
                <Zap className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.75} aria-hidden />
                <div>
                  <p className="font-semibold">{c.evTitle}</p>
                  <p className="mt-0.5 text-muted">{c.dmvElectric}</p>
                </div>
              </div>
            )}
            {s.makeId && s.modelId && (
              <CarInfoPanel
                lang={lang}
                dict={dict}
                makeId={s.makeId}
                modelId={s.modelId}
                year={s.isNew ? now.getFullYear() : s.regYear}
                fuel={s.fuel}
                kw={s.kw}
              />
            )}
          </div>
        </aside>

        {!domestic && (
          <div className="lg:col-start-1">
            <Section n={nextStep()} title={c.guideTitle}>
              <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[...c.guide.slice(0, 4), ...(newForVat ? [c.guideVat] : []), ...c.guide.slice(4)].map((g, i, all) => {
                  // The VAT step has no icon of its own; the last steps keep theirs.
                  const Icon = newForVat && i === 4 ? Wallet : GUIDE_ICONS[i - (newForVat && i > 4 ? 1 : 0)] ?? FileText;
                  return (
                    <li key={g.title} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <Eyebrow className="text-accent">{t(c.step, { n: String(i + 1).padStart(2, "0"), total: all.length })}</Eyebrow>
                        <Icon className="size-[18px] text-accent" strokeWidth={1.75} aria-hidden />
                      </div>
                      <h3 className="mt-2 font-semibold">{g.title}</h3>
                      <p className="mt-1 text-sm text-muted">{g.text}</p>
                    </li>
                  );
                })}
              </ol>
            </Section>
          </div>
        )}
      </div>

      {/* Phones and tablets: keep the total in view while filling in the form. */}
      <a
        href="#result"
        className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 flex items-center justify-between gap-3 border-t border-border bg-card/95 px-4 py-3 backdrop-blur sm:bottom-0 lg:hidden"
      >
        {total !== null ? (
          <>
            <span>
              <Eyebrow className="block">{c.total}</Eyebrow>
              <span className="font-mono text-xl font-semibold text-accent">{eur(total)}</span>
            </span>
            <span className={button("soft", { small: true })}>{c.seeBreakdown}</span>
          </>
        ) : (
          <span className="text-sm text-muted">{missingText}</span>
        )}
      </a>
    </div>
  );
}

/** The model's engines from EU registrations; picking one fills in fuel and power, and CO2 follows. */
function EnginePicker({
  rows,
  loading,
  s,
  firstReg,
  now,
  lang,
  dict,
  onPick,
}: {
  rows: Parameters<typeof listEngines>[0];
  loading: boolean;
  s: CarInput;
  firstReg: Date | undefined | null;
  now: Date;
  lang: Locale;
  dict: Dict;
  onPick: (engine: Engine) => void;
}) {
  const c = dict.check;
  const [showAll, setShowAll] = useState(false);
  const year = s.isNew ? now.getFullYear() : s.regYear;
  // A year without data (a brand-new model year, a typo) shouldn't empty the list.
  const near = listEngines(rows, year);
  const engines = near.length ? near : listEngines(rows);
  const selected = engines.find((x) => x.fuel === s.fuel && s.kw !== undefined && Math.abs(x.kw - s.kw) <= kwTolerance(x.kw));
  const shown = showAll ? engines : engines.slice(0, ENGINES_SHOWN);
  if (selected && !shown.includes(selected)) shown.push(selected);
  const hp = lang === "sl" ? "KM" : c.hp;
  const eur = (n: number) => formatEur(n, lang);

  return (
    <div className="mt-5 border-t border-border pt-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-[13px] font-medium text-muted">{c.engineTitle}</h3>
        {!loading && <Eyebrow>{t(c.engineCount, { n: engines.length })}</Eyebrow>}
      </div>
      {loading ? (
        <p className="text-sm text-muted">{c.engineLoading}</p>
      ) : (
        <>
          <div role="radiogroup" aria-label={c.engineTitle} className="space-y-2">
            {shown.map((engine) => {
              const at = firstReg ?? new Date(year ?? engine.toYear, (s.regMonth ?? 7) - 1, 1);
              const match = lookupCo2(rows, { fuel: engine.fuel, kw: engine.kw, firstReg: s.isNew ? undefined : at, now });
              const isSelected = engine === selected;
              // DMV doesn't depend on the price, only on emissions and age, so it can be compared before the price is in.
              const dmv =
                (firstReg !== null || year !== undefined) && (match || engine.fuel === "electric")
                  ? calculateDmv({
                      fuel: engine.fuel,
                      scale: isHybrid(engine.fuel) && match?.dieselScale ? "diesel" : undefined,
                      co2: match?.co2,
                      cycle: match?.cycle ?? "wltp",
                      euro: match?.euro ?? euroByRegistration(at.getFullYear(), at.getMonth() + 1),
                      // Only the year known: mid-year, as for the CO2 figure.
                      firstRegistration: s.isNew ? undefined : (firstReg ?? at),
                      eightPlusSeats: s.eightPlusSeats,
                      at: now,
                    }).total
                  : undefined;
              return (
                <button
                  key={`${engine.fuel}-${engine.kw}`}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onPick(engine)}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 px-3 py-3 text-left transition-colors ${
                    isSelected ? "border-accent bg-accent-soft/50" : "border-transparent bg-surface-low hover:border-border-strong"
                  }`}
                >
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${isSelected ? "border-accent" : "border-border-strong"}`}
                    aria-hidden
                  >
                    {isSelected && <span className="size-2.5 rounded-full bg-accent" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-semibold">
                        {engine.kw} kW ({kwToHp(engine.kw)} {hp})
                      </span>
                      <Pill tone={engine.fuel === "electric" ? "success" : "neutral"}>{dict.fuel[engine.fuel]}</Pill>
                      <Pill tone="neutral">{engine.fromYear === engine.toYear ? engine.fromYear : `${engine.fromYear}–${engine.toYear}`}</Pill>
                    </span>
                    <span className="mt-1 block font-mono text-[12px] text-muted">
                      {[
                        match && `CO₂ ${match.co2} g/km ${match.cycle.toUpperCase()}`,
                        t(c.engineCars, { n: formatNumber(engine.cars, lang) }),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  {dmv !== undefined && (
                    <span className="shrink-0 text-right">
                      <Eyebrow className="block">{c.estDmv}</Eyebrow>
                      <span className="font-mono text-[15px] font-semibold text-accent">{eur(dmv)}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            {engines.length > ENGINES_SHOWN ? (
              <button type="button" onClick={() => setShowAll((x) => !x)} className="min-h-9 font-medium text-accent hover:underline">
                {showAll ? c.showFewerEngines : t(c.showAllEngines, { n: engines.length })}
              </button>
            ) : (
              <span />
            )}
            <span className="text-xs text-muted">{firstReg === null && year === undefined ? c.engineNeedsYear : c.engineHint}</span>
          </div>
        </>
      )}
    </div>
  );
}

function Section({ n, title, aside, children }: { n: string; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 text-lg font-semibold">
          <span className="rounded-md bg-accent-soft px-2 py-0.5 font-mono text-[13px] text-accent">{n}</span>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function CostField({
  icon: Icon,
  id,
  label,
  hint,
  value,
  onValue,
}: {
  icon: LucideIcon;
  id: string;
  label: string;
  hint: string;
  value?: number;
  onValue: (v: number | undefined) => void;
}) {
  return (
    <div className="rounded-xl bg-surface-low p-3">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-5 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
        <div className="min-w-0 flex-1">
          <label htmlFor={id} className="text-sm font-medium">{label}</label>
          <p className="text-xs text-muted">{hint}</p>
        </div>
      </div>
      <NumberInput id={id} min={0} step={50} unit="EUR" className="mt-2" value={value} onValue={onValue} />
    </div>
  );
}

const Hint = ({ children }: { children: ReactNode }) => <p className="mt-1.5 text-xs text-muted">{children}</p>;

function Line({ label, value, strong, children }: { label: string; value: string; strong?: boolean; children?: ReactNode }) {
  return (
    <div className="py-2.5">
      <div className="flex items-baseline justify-between gap-4">
        <dt className={strong ? "font-semibold text-accent" : ""}>{label}</dt>
        <dd className={`font-mono font-medium ${strong ? "text-accent" : ""}`}>{value}</dd>
      </div>
      {children && <div className="mt-1.5 space-y-1 border-l border-border-strong pl-3 font-mono text-[12px] text-muted">{children}</div>}
    </div>
  );
}

function BreakdownRow({ label, value }: { label: string; value?: string }) {
  return (
    <p className="flex justify-between gap-3">
      <span>{label}</span>
      {value && <span>{value}</span>}
    </p>
  );
}

function TotalBlock({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <div className="border-t border-border bg-surface-low px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <Eyebrow>{label}</Eyebrow>
        <span className="font-mono text-3xl font-semibold tracking-tight text-accent">{value}</span>
      </div>
      {children}
    </div>
  );
}

function Note({ icon, children }: { icon: "info" | "warn"; children: ReactNode }) {
  const Icon = icon === "warn" ? AlertTriangle : Info;
  return (
    <p className={`flex items-start gap-2 ${icon === "warn" ? "text-warning" : "text-muted"}`}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      {children}
    </p>
  );
}
