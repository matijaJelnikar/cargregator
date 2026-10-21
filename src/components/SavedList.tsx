"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Bookmark, Calculator, CarFront, Check, Clock, Copy, Download, Lock, MapPin, Pencil, Plus,
  ShieldCheck, SlidersHorizontal, Trash2, Upload,
} from "lucide-react";
import { fromQuery } from "@/lib/filters";
import { formatDate, t, type Dict, type Locale } from "@/lib/i18n";
import { SITES, isInRange, linkContext, marketCode } from "@/lib/sites/registry";
import { SAVED_KEY, addSaved, exportBackup, importBackup, parseSaved, removeSaved, updateSaved } from "@/lib/storage";
import { useStored } from "@/lib/useStored";
import { summaryParts } from "@/lib/summary";
import { Card, Eyebrow, FilterChip, Pill, Toast, button, inputClass } from "./ui";

export function SavedList({ lang, dict }: { lang: Locale; dict: Dict }) {
  const raw = useStored("local", SAVED_KEY);
  const list = useMemo(() => (raw === undefined ? null : parseSaved(raw)), [raw]);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  if (list === null) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] font-bold leading-tight tracking-tight sm:text-4xl">{dict.saved.title}</h1>
            {list.length > 0 && <Pill tone="info" dot>{t(dict.saved.count, { n: list.length })}</Pill>}
            <Pill tone="neutral">
              <Lock className="size-3" aria-hidden />
              {dict.saved.local}
            </Pill>
          </div>
          <p className="mt-2 max-w-2xl text-muted">{dict.saved.subtitle}</p>
        </div>
        <Link href={`/${lang}/`} className={button("primary", { className: "shrink-0" })}>
          <Plus className="size-4" aria-hidden />
          {dict.saved.newSearch}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="space-y-4">
          {list.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong p-10 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-surface-low text-accent">
                <Bookmark className="size-6" strokeWidth={1.75} aria-hidden />
              </span>
              <p className="mt-4 font-semibold">{dict.saved.empty}</p>
              <p className="mt-1 text-sm text-muted">{dict.saved.emptyHint}</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {list.map((s, i) => {
                const filters = fromQuery(s.query);
                const ctx = linkContext(filters);
                const sites = SITES.filter((x) => filters.sites.includes(x.id));
                const isEditing = editing === s.id;
                return (
                  <li
                    key={s.id}
                    className={`rounded-xl border bg-card p-4 sm:p-5 ${isEditing ? "border-accent border-t-4" : "border-border"}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                      <Eyebrow>{t(dict.saved.profile, { n: String(i + 1).padStart(2, "0") })}</Eyebrow>
                      <span className="flex items-center gap-1.5 font-mono text-[12px] text-muted">
                        <Clock className="size-3.5" aria-hidden />
                        {s.lastRunAt
                          ? t(dict.saved.lastRun, { date: formatDate(s.lastRunAt, lang) })
                          : t(dict.saved.created, { date: formatDate(s.createdAt, lang) })}
                      </span>
                    </div>

                    {isEditing ? (
                      <form
                        className="mt-4 flex flex-wrap gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (draft.trim()) updateSaved(s.id, { name: draft.trim() });
                          setEditing(null);
                        }}
                      >
                        <input
                          autoFocus
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          aria-label={dict.saved.rename}
                          maxLength={80}
                          className={`${inputClass} min-w-0 flex-1 basis-60 text-base font-semibold`}
                        />
                        <div className="flex gap-2">
                          <button type="submit" className={button("primary")}>
                            <Check className="size-4" aria-hidden />
                            {dict.saved.save}
                          </button>
                          <button type="button" onClick={() => setEditing(null)} className={button("ghost")}>
                            {dict.results.cancel}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <h2 className="mt-4 text-xl font-semibold tracking-tight">{s.name}</h2>
                    )}

                    <ul className="mt-3 flex flex-wrap gap-2" aria-label={dict.results.filters}>
                      {summaryParts(filters, dict, lang).map((p) => (
                        <li key={p.text}>
                          <FilterChip icon={p.kind === "car" ? CarFront : p.kind === "place" ? MapPin : undefined}>{p.text}</FilterChip>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Eyebrow>{dict.saved.sites}</Eyebrow>
                      {sites.map((x) => (
                        <span
                          key={x.id}
                          className={`rounded-md bg-info-soft px-2 py-1 font-mono text-[11px] text-info ${isInRange(x, ctx) ? "" : "opacity-50 line-through"}`}
                        >
                          [{marketCode(x)}] {x.name}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                      <Link href={`/${lang}/results/?${s.query}`} className={button("primary", { small: true })}>
                        {dict.saved.run}
                        <ArrowRight className="size-4" aria-hidden />
                      </Link>
                      <Link href={`/${lang}/?${s.query}`} className={button("soft", { small: true })}>
                        <SlidersHorizontal className="size-4" aria-hidden />
                        {dict.saved.editFilters}
                      </Link>
                      <div className="flex flex-wrap gap-1 sm:ml-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(s.id);
                            setDraft(s.name);
                          }}
                          className={button("ghost", { small: true })}
                        >
                          <Pencil className="size-4" aria-hidden />
                          {dict.saved.rename}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            addSaved(t(dict.saved.copyName, { name: s.name }), filters);
                            setToast(dict.saved.duplicated);
                          }}
                          className={button("ghost", { small: true })}
                        >
                          <Copy className="size-4" aria-hidden />
                          {dict.saved.duplicate}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(t(dict.saved.confirmDelete, { name: s.name }))) removeSaved(s.id);
                          }}
                          className={button("ghost", { small: true, className: "text-danger hover:text-danger" })}
                        >
                          <Trash2 className="size-4" aria-hidden />
                          {dict.saved.delete}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {list.length > 0 && (
            <Link
              href={`/${lang}/`}
              className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border-strong p-6 text-center hover:bg-surface-low"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-surface-low text-muted">
                <Plus className="size-5" aria-hidden />
              </span>
              <span className="font-semibold">{dict.saved.addAnother}</span>
              <span className="text-sm text-muted">{dict.saved.addAnotherHint}</span>
            </Link>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <PrivacyCard dict={dict} onDone={setToast} />
          <Card title={dict.saved.importTitle} icon={Calculator}>
            <p className="text-sm text-muted">{dict.saved.importText}</p>
            <Link href={`/${lang}/check/`} className={button("soft", { className: "mt-4 w-full" })}>
              {dict.saved.importButton}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Card>
        </aside>
      </div>

      <Toast message={toast} />
    </div>
  );
}

function PrivacyCard({ dict, onDone }: { dict: Dict; onDone: (message: string) => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [error, setError] = useState(false);

  function download() {
    const blob = new Blob([JSON.stringify(exportBackup(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cargregator-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function load(f: File) {
    const added = importBackup(await f.text());
    setError(added === null);
    if (added !== null) onDone(t(dict.saved.imported, { n: added }));
  }

  return (
    <Card title={dict.saved.privacyTitle} icon={ShieldCheck} aside={<Pill tone="success">{dict.saved.privatePill}</Pill>}>
      <p className="text-sm text-muted">{dict.about.privacy}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={download} className={button("soft", { small: true })}>
          <Download className="size-4" aria-hidden />
          {dict.saved.export}
        </button>
        <button type="button" onClick={() => file.current?.click()} className={button("soft", { small: true })}>
          <Upload className="size-4" aria-hidden />
          {dict.saved.import}
        </button>
      </div>
      <input
        ref={file}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) load(f);
          e.target.value = "";
        }}
      />
      <p className="mt-3 text-xs text-muted">{dict.saved.backupHint}</p>
      {error && <p className="mt-2 text-sm text-warning" role="alert">{dict.saved.importFailed}</p>}
    </Card>
  );
}
