"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight, BookmarkPlus, Calculator, CarFront, Check, CheckCircle2, Circle, ExternalLink, Info, ListChecks, MapPin,
  Share2, SlidersHorizontal, Unplug,
} from "lucide-react";
import { findCity } from "@/data/cities";
import { fromQuery, toQuery, type SearchFilters } from "@/lib/filters";
import { formatNumber, t, type Dict, type Locale } from "@/lib/i18n";
import { buildResults, marketCode, radiusToReach, type SiteResult } from "@/lib/sites/registry";
import type { SiteLink } from "@/lib/sites/types";
import { OPENED_KEY, addOpened, addSaved, markRun, parseOpened, saveLastSearch } from "@/lib/storage";
import { useStored } from "@/lib/useStored";
import { summarize, summaryParts } from "@/lib/summary";
import { Card, CountryCode, Eyebrow, FilterChip, Pill, Toast, button, inputClass } from "./ui";

const countryNames = (r: SiteResult, dict: Dict) =>
  r.site.countries.length > 3 ? dict.results.europe : r.site.countries.map((c) => dict.countries[c as keyof Dict["countries"]]).join(", ");

export function ResultsView({ lang, dict }: { lang: Locale; dict: Dict }) {
  const params = useSearchParams();
  const filters = useMemo(() => fromQuery(params), [params]);
  const query = useMemo(() => toQuery(filters), [filters]);
  const results = useMemo(() => buildResults(filters), [filters]);
  const active = results.filter((r) => r.links.length > 0);
  const inactive = results.filter((r) => r.links.length === 0);
  const allLinks = active.flatMap((r) => r.links);

  const openedRaw = useStored("session", OPENED_KEY);
  const opened = useMemo(() => parseOpened(openedRaw, query), [openedRaw, query]);
  const [toast, setToast] = useState<string | null>(null);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    saveLastSearch(filters);
    markRun(query);
  }, [query, filters]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  const summary = summarize(filters, dict, lang);
  const openedCount = allLinks.filter((l) => opened.includes(l.url)).length;
  const city = findCity(filters.cityId);
  const resultsHref = (f: SearchFilters) => `/${lang}/results/?${toQuery(f)}`;

  async function share() {
    const url = window.location.href;
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title: "Cargregator", text: summary, url });
        return;
      } catch {
        // Cancelled or unsupported: fall through to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setToast(dict.results.copied);
    } catch {
      window.prompt(dict.results.share, url);
    }
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    addSaved(name.trim() || summary, filters);
    setNaming(false);
    setName("");
    setToast(dict.results.savedToast);
  }

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow className="text-accent">{dict.results.eyebrow}</Eyebrow>
        <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight sm:text-4xl">
          {t(dict.results.title, { n: active.length })}
        </h1>
        <p className="mt-2 max-w-2xl text-muted">{dict.results.subtitle}</p>
      </div>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="sr-only">{dict.results.filters}</h2>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <ul className="flex flex-wrap gap-2">
            {summaryParts(filters, dict, lang).map((p) => (
              <li key={p.text}>
                <FilterChip icon={p.kind === "car" ? CarFront : p.kind === "place" ? MapPin : undefined}>{p.text}</FilterChip>
              </li>
            ))}
          </ul>
          <div className="grid shrink-0 grid-cols-3 gap-2 sm:flex">
            <Link href={`/${lang}/?${query}`} className={button("soft", { className: "px-3" })}>
              <SlidersHorizontal className="size-4" aria-hidden />
              {dict.results.edit}
            </Link>
            <button type="button" onClick={() => setNaming(true)} className={button("soft", { className: "px-3" })}>
              <BookmarkPlus className="size-4" aria-hidden />
              {dict.results.save}
            </button>
            <button type="button" onClick={share} className={button("soft", { className: "px-3" })}>
              <Share2 className="size-4" aria-hidden />
              {dict.results.share}
            </button>
          </div>
        </div>
        {naming && (
          <form onSubmit={save} className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={summary}
              aria-label={dict.results.namePlaceholder}
              maxLength={80}
              className={`${inputClass} min-w-0 flex-1 basis-60`}
            />
            <div className="flex gap-2">
              <button type="submit" className={button("primary")}>
                <Check className="size-4" aria-hidden />
                {dict.results.confirmSave}
              </button>
              <button type="button" onClick={() => setNaming(false)} className={button("ghost")}>
                {dict.results.cancel}
              </button>
            </div>
          </form>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="space-y-6">
          {active.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border-strong p-8 text-center text-muted">{dict.results.nothing}</p>
          ) : (
            <section>
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <h2 className="text-lg font-semibold">{dict.results.inRange}</h2>
                <span className="font-mono text-[13px] text-muted lg:hidden">
                  {t(dict.results.progress, { opened: openedCount, total: allLinks.length })}
                </span>
              </div>
              <ul className="grid gap-4 md:grid-cols-2">
                {active.map((r) => (
                  <SiteCard
                    key={r.site.id}
                    result={r}
                    dict={dict}
                    cityName={city?.name ?? ""}
                    radiusKm={filters.radiusKm}
                    opened={opened}
                    onOpen={(url) => addOpened(query, url)}
                  />
                ))}
              </ul>
              <p className="mt-4 flex items-start gap-2 text-sm text-muted lg:hidden">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                {dict.results.popupNote}
              </p>
            </section>
          )}

          {inactive.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">{dict.results.unavailable}</h2>
              <ul className="space-y-3">
                {inactive.map((r) => {
                  const reach = r.enabled && city ? radiusToReach(r.site, city) : undefined;
                  return (
                    <li key={r.site.id} className="flex flex-col gap-3 rounded-xl bg-surface-low p-4 sm:flex-row sm:items-center">
                      <span className="hidden size-10 shrink-0 items-center justify-center rounded-lg bg-card text-subtle sm:flex">
                        <Unplug className="size-5" strokeWidth={1.75} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <CountryCode code={marketCode(r.site)} />
                          <span className="font-semibold">{r.site.name}</span>
                          <Pill tone={r.enabled ? "warning" : "neutral"}>
                            {r.enabled ? t(dict.results.outOfRangePill, { radius: filters.radiusKm }) : dict.results.offPill}
                          </Pill>
                        </div>
                        <p className="mt-1 text-sm text-muted">
                          {!r.enabled
                            ? dict.results.disabledNote
                            : t(dict.results.outOfRangeNote, { countries: countryNames(r, dict), radius: filters.radiusKm })}
                        </p>
                      </div>
                      {!r.enabled ? (
                        <Link href={resultsHref({ ...filters, sites: [...filters.sites, r.site.id] })} className={button("secondary", { small: true })}>
                          {dict.results.turnOn}
                        </Link>
                      ) : (
                        reach && (
                          <Link href={resultsHref({ ...filters, radiusKm: reach })} className={button("secondary", { small: true })}>
                            {t(dict.search.expandRadius, { radius: `${formatNumber(reach, lang)} km` })}
                          </Link>
                        )
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          {active.length > 0 && (
            <Card
              title={dict.results.progressTitle}
              icon={ListChecks}
              className="hidden lg:block"
              aside={<span className="font-mono text-[13px] font-semibold text-accent">{openedCount}/{allLinks.length}</span>}
            >
              <div className="h-1.5 overflow-hidden rounded-full bg-surface" aria-hidden>
                <div
                  className="h-full rounded-full bg-accent transition-[width]"
                  style={{ width: `${allLinks.length ? (openedCount / allLinks.length) * 100 : 0}%` }}
                />
              </div>
              <p className="sr-only">{t(dict.results.progress, { opened: openedCount, total: allLinks.length })}</p>
              <ol className="mt-4 space-y-2">
                {active.map((r, i) => {
                  const done = r.links.every((l) => opened.includes(l.url));
                  return (
                    <li key={r.site.id} className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm ${done ? "bg-surface-low" : "bg-info-soft/60"}`}>
                      {done ? (
                        <CheckCircle2 className="size-[18px] text-success" aria-hidden />
                      ) : (
                        <Circle className="size-[18px] text-info" aria-hidden />
                      )}
                      <span className="flex-1">
                        {i + 1}. {r.site.name} <span className="text-muted">({marketCode(r.site)})</span>
                      </span>
                      <span className={`font-mono text-[11px] font-medium ${done ? "text-success" : "text-info"}`}>
                        {done ? dict.results.done : dict.results.pending}
                      </span>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-4 flex items-start gap-2 rounded-lg bg-surface-low p-3 text-xs text-muted">
                <Info className="mt-px size-4 shrink-0" aria-hidden />
                {dict.results.popupNote}
              </p>
            </Card>
          )}
          <Card title={dict.results.importTitle} icon={Calculator}>
            {/* A search for a specific car opens the calculator prefilled from it; otherwise the page to paste a link. */}
            <p className="text-sm text-muted">{filters.makeId ? dict.results.checkSearch : dict.results.checkCar}</p>
            <Link
              href={`/${lang}/check/?${query}${filters.makeId ? "&manual=1" : ""}`}
              className={button("soft", { className: "mt-4 w-full" })}
            >
              {dict.results.checkCarButton}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Card>
        </aside>
      </div>

      <Toast message={toast} />
    </div>
  );
}

function SiteCard({
  result: r,
  dict,
  cityName,
  radiusKm,
  opened,
  onOpen,
}: {
  result: SiteResult;
  dict: Dict;
  cityName: string;
  radiusKm: number;
  opened: string[];
  onOpen: (url: string) => void;
}) {
  const allOpened = r.links.every((l) => opened.includes(l.url));
  const anchor = r.links[0]?.anchor;
  const location =
    r.location === "exact"
      ? t(dict.results.exact, { radius: radiusKm, city: cityName })
      : r.location === "approximate"
        ? anchor ? t(dict.results.approximate, { radius: anchor.radiusKm, city: anchor.city }) : dict.results.approximateArea
        : dict.results.country;
  const tone = r.location === "exact" ? "text-success" : r.location === "approximate" ? "text-warning" : "text-info";

  return (
    <li
      className={`relative flex flex-col overflow-hidden rounded-xl border bg-card p-4 pl-5 transition-colors ${
        allOpened ? "border-border" : "border-accent/40"
      }`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${allOpened ? "bg-success" : "bg-accent"}`} aria-hidden />
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <CountryCode code={marketCode(r.site)} />
          {r.site.name}
        </h3>
        {allOpened ? (
          <Pill tone="success">
            <Check className="size-3" strokeWidth={3} aria-hidden />
            {dict.results.opened}
          </Pill>
        ) : (
          <Pill tone="info" dot>{dict.results.ready}</Pill>
        )}
      </div>

      <dl className="mt-3 flex-1 space-y-1.5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{dict.results.marketLabel}</dt>
          <dd className="text-right">{countryNames(r, dict)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{dict.results.areaLabel}</dt>
          <dd className={`text-right font-medium ${tone}`}>{location}</dd>
        </div>
        {r.skipped.length > 0 && (
          <div className="flex justify-between gap-4">
            <dt className="shrink-0 text-muted">{dict.results.notAppliedLabel}</dt>
            <dd className="text-right">{r.skipped.map((k) => dict.filterNames[k]).join(", ")}</dd>
          </div>
        )}
        {r.keyword && <p className="pt-1 text-xs text-muted">{dict.results.keywordNote}</p>}
      </dl>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {r.links.map((link) => (
          <OpenButton
            key={link.url}
            link={link}
            label={
              r.links.length > 1 && link.anchor
                ? t(dict.results.approximate, { radius: link.anchor.radiusKm, city: link.anchor.city })
                : t(dict.results.openSite, { site: r.site.name })
            }
            againLabel={
              r.links.length > 1 && link.anchor
                ? t(dict.results.approximate, { radius: link.anchor.radiusKm, city: link.anchor.city })
                : dict.results.openAgain
            }
            opened={opened.includes(link.url)}
            onOpen={onOpen}
          />
        ))}
      </div>
    </li>
  );
}

function OpenButton({
  link,
  label,
  againLabel,
  opened,
  onOpen,
}: {
  link: SiteLink;
  label: string;
  againLabel: string;
  opened: boolean;
  onOpen: (url: string) => void;
}) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => onOpen(link.url)}
      className={button(opened ? "soft" : "primary")}
    >
      {opened && <Check className="size-4" aria-hidden />}
      {opened ? againLabel : label}
      <ExternalLink className="size-4" aria-hidden />
    </a>
  );
}
