"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Search, X } from "lucide-react";
import { guideHref, searchGuide, type GuideHit } from "@/lib/guideSearch";
import { t, type Dict, type Locale } from "@/lib/i18n";
import { inputClass } from "./ui";

/** The guide's search: type a make or model, then pick a car to open its page. */
export function GuideSearch({ lang, dict }: { lang: Locale; dict: Dict }) {
  const c = dict.carInfo;
  const router = useRouter();
  const inputId = useId();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const hits = useMemo(() => searchGuide(query), [query]);
  const show = open && query.trim().length > 0;

  function go(hit: GuideHit | undefined) {
    if (!hit) return;
    setOpen(false);
    router.push(guideHref(lang, hit));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-medium text-muted">
        {c.searchTitle}
      </label>
      <div className="relative">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            go(hits[active] ?? hits[0]);
          }}
          className="relative"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-subtle" aria-hidden />
          <input
            id={inputId}
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
            placeholder={c.searchPlaceholder}
            role="combobox"
            aria-expanded={show}
            aria-controls={show ? listId : undefined}
            aria-autocomplete="list"
            aria-activedescendant={show && hits.length ? `${listId}-${active}` : undefined}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setOpen(true);
            }}
            onKeyDown={onKeyDown}
            onFocus={() => query.trim() && setOpen(true)}
            onBlur={() => setOpen(false)}
            className={`${inputClass} h-12 pl-10 pr-10 text-base`}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActive(0);
              }}
              className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-subtle hover:bg-surface-low hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
              <span className="sr-only">{c.searchClear}</span>
            </button>
          )}
        </form>

        {show && (
          <div className="absolute inset-x-0 top-full z-20 mt-2 max-h-80 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
            {hits.length ? (
              <ul id={listId} role="listbox" aria-label={c.searchTitle}>
                {hits.map((hit, i) => (
                  <li
                    key={hit.model?.id ?? hit.make.id}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => go(hit)}
                    onMouseEnter={() => setActive(i)}
                    className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      i === active ? "bg-surface-low" : ""
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate font-medium ${i === active ? "text-accent" : ""}`}>
                        {hit.model ? hit.model.name : hit.make.name}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {hit.model ? hit.make.name : t(c.searchAllModels, { make: hit.make.name })}
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-subtle" aria-hidden />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-3 text-sm text-muted">{c.searchNoResults}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
