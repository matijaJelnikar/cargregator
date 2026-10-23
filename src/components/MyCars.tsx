"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CarFront, ClipboardPaste, ExternalLink, Link2, Pencil, Smartphone, Trash2 } from "lucide-react";
import { CarRiskPill } from "@/components/CarInfoCard";
import { evaluateCar, resolveCar, type CarResult } from "@/lib/carInput";
import { formatDate, formatEur, t, type Dict, type Locale } from "@/lib/i18n";
import { parseListing } from "@/lib/listing";
import { findSite } from "@/lib/sites/registry";
import { CARS_KEY, parseCars, removeCar } from "@/lib/storage";
import { useStored } from "@/lib/useStored";
import { Card, Eyebrow, Pill, button, inputClass } from "./ui";

const totalOf = (r: CarResult) => (r.kind === "import" ? r.cost.total : r.kind === "domestic" ? r.total : undefined);

/** The import page without a car: add one by its link, and the list of cars checked so far. */
export function MyCars({ lang, dict, notice }: { lang: Locale; dict: Dict; notice?: string }) {
  const c = dict.cars;
  const router = useRouter();
  const params = useSearchParams();
  const raw = useStored("local", CARS_KEY);
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | undefined>(notice);

  const cars = useMemo(() => {
    if (raw === undefined) return null;
    const now = new Date();
    // Cheapest first; cars still missing details at the end.
    return parseCars(raw)
      .map((car) => ({ car, result: evaluateCar(resolveCar(car.input, car.auto, now), now) }))
      .sort((a, b) => (totalOf(a.result) ?? Infinity) - (totalOf(b.result) ?? Infinity));
  }, [raw]);

  /** Keeps the search filters in the URL so they still prefill the calculator. */
  function go(extra: Record<string, string>) {
    const q = new URLSearchParams(params);
    for (const k of ["u", "tx", "ti", "car", "manual"]) q.delete(k);
    for (const [k, v] of Object.entries(extra)) q.set(k, v);
    router.push(`/${lang}/check/?${q}`);
  }

  function submit(value: string) {
    const listing = parseListing({ text: value });
    if (!listing) {
      setError(c.badLink);
      return;
    }
    // The whole pasted text goes along: a share sheet's text can carry the title and price.
    go(value.trim() === listing.url ? { u: listing.url } : { tx: value.trim() });
  }

  async function paste() {
    try {
      const text = await navigator.clipboard.readText();
      setLink(text);
      submit(text);
    } catch {
      setError(c.pasteFailed);
    }
  }

  const eur = (n: number) => formatEur(n, lang);

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow className="text-accent">{c.eyebrow}</Eyebrow>
        <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight sm:text-4xl">{dict.check.title}</h1>
        <p className="mt-2 max-w-2xl text-muted">{c.subtitle}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
        <aside className="space-y-4 lg:sticky lg:top-24 lg:order-2">
          <Card title={c.addTitle} icon={Link2} className="border-accent/40">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(link);
              }}
            >
              <label htmlFor="link" className="mb-1.5 block text-[13px] font-medium text-muted">{c.linkLabel}</label>
              <input
                id="link"
                type="url"
                inputMode="url"
                value={link}
                onChange={(e) => {
                  setLink(e.target.value);
                  setError(undefined);
                }}
                placeholder="https://…"
                aria-invalid={error === c.badLink || undefined}
                aria-describedby={error ? "link-error" : undefined}
                className={`${inputClass} font-mono text-sm`}
              />
              {error && (
                <p id="link-error" className="mt-2 text-sm text-warning">{error}</p>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={paste} className={button("secondary")}>
                  <ClipboardPaste className="size-4" aria-hidden />
                  {c.paste}
                </button>
                <button type="submit" className={button("primary")}>
                  {c.check}
                  <ArrowRight className="size-4" aria-hidden />
                </button>
              </div>
            </form>
            <button type="button" onClick={() => go({ manual: "1" })} className="mt-3 min-h-9 text-sm font-medium text-accent hover:underline">
              {c.manual}
            </button>
          </Card>
          <p className="flex items-start gap-2 rounded-xl bg-surface-low p-4 text-xs text-muted">
            <Smartphone className="mt-px size-4 shrink-0 text-accent" aria-hidden />
            {c.androidHint}
          </p>
        </aside>

        <section className="lg:order-1">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-semibold">{c.listTitle}</h2>
            {cars && cars.length > 0 && <Eyebrow>{t(c.count, { n: cars.length })}</Eyebrow>}
          </div>
          {cars === null ? null : cars.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong p-6 sm:p-8">
              <span className="flex size-12 items-center justify-center rounded-full bg-surface-low text-accent">
                <CarFront className="size-6" strokeWidth={1.75} aria-hidden />
              </span>
              <p className="mt-4 font-semibold">{c.empty}</p>
              <ol className="mt-4 grid gap-3 sm:grid-cols-3">
                {c.steps.map((step, i) => (
                  <li key={step} className="rounded-xl bg-surface-low p-3 text-sm text-muted">
                    <Eyebrow className="mb-1 block text-accent">{t(dict.check.step, { n: String(i + 1).padStart(2, "0") })}</Eyebrow>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <ul className="space-y-3">
              {cars.map(({ car, result }) => {
                const total = totalOf(result);
                const site = car.site ? findSite(car.site).name : car.url ? new URL(car.url).hostname.replace(/^www\./, "") : undefined;
                return (
                  <li key={car.id} className="rounded-xl border border-border bg-card p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-semibold">{car.title}</h3>
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                          {site && <Pill tone="info">{site}</Pill>}
                          {car.input.price !== undefined && <span className="font-mono">{t(c.price, { price: eur(car.input.price) })}</span>}
                          <CarRiskPill dict={dict} modelId={car.input.modelId} year={car.input.regYear} fuel={car.input.fuel} kw={car.input.kw} />
                        </p>
                        <p className="mt-1.5 font-mono text-[11px] text-subtle">{t(c.added, { date: formatDate(car.addedAt, lang) })}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        {total !== undefined ? (
                          <>
                            <Eyebrow className="block">{result.kind === "domestic" ? c.inSlovenia : c.total}</Eyebrow>
                            <p className="font-mono text-xl font-semibold text-accent">{eur(total)}</p>
                          </>
                        ) : (
                          <p className="max-w-36 text-xs text-warning">{c.incomplete}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                      <Link href={`/${lang}/check/?car=${car.id}`} className={button("primary", { small: true })}>
                        <Pencil className="size-4" aria-hidden />
                        {c.edit}
                      </Link>
                      {car.url && (
                        <a href={car.url} target="_blank" rel="noopener noreferrer" className={button("soft", { small: true })}>
                          <ExternalLink className="size-4" aria-hidden />
                          {c.open}
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(t(c.confirmDelete, { name: car.title }))) removeCar(car.id);
                        }}
                        className={button("ghost", { small: true, className: "ml-auto hover:text-danger" })}
                      >
                        <Trash2 className="size-4" aria-hidden />
                        {c.delete}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
