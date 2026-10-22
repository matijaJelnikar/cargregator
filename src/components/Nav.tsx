"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, BookOpen, Calculator, CarFront, Info, Monitor, Moon, Search, Sun } from "lucide-react";
import { LOCALES, type Dict, type Locale } from "@/lib/i18n";
import { SAVED_KEY, THEME_KEY, parseSaved, parseTheme, saveTheme } from "@/lib/storage";
import { useStored } from "@/lib/useStored";

export function Nav({ lang, dict }: { lang: Locale; dict: Dict }) {
  const pathname = usePathname();
  const rest = pathname.replace(/^\/(sl|en)/, "");
  const savedCount = parseSaved(useStored("local", SAVED_KEY)).length;
  const items = [
    { href: `/${lang}/`, label: dict.nav.search, icon: Search, active: rest === "" || rest === "/" || rest.startsWith("/results") },
    { href: `/${lang}/check/`, label: dict.nav.check, icon: Calculator, active: rest.startsWith("/check") },
    { href: `/${lang}/avti/`, label: dict.nav.cars, icon: BookOpen, active: rest.startsWith("/avti") },
    { href: `/${lang}/saved/`, label: dict.nav.saved, icon: Bookmark, active: rest.startsWith("/saved"), count: savedCount },
    { href: `/${lang}/about/`, label: dict.nav.about, icon: Info, active: rest.startsWith("/about") },
  ];

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link href={`/${lang}/`} className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <CarFront className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-semibold tracking-tight">Cargregator</span>
              <span className="mt-1 font-mono text-[10px] uppercase tracking-wider text-subtle">SI · AT · DE · HR</span>
            </span>
          </Link>
          <nav className="mx-auto hidden items-center gap-1 sm:flex">
            {items.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                aria-current={i.active ? "page" : undefined}
                className={`flex h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-medium transition-colors ${
                  i.active ? "bg-accent text-accent-foreground" : "text-muted hover:bg-surface-low hover:text-foreground"
                }`}
              >
                {i.active && <i.icon className="size-4" aria-hidden />}
                {i.label}
                {Boolean(i.count) && <Count n={i.count!} active={i.active} />}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:ml-0">
            <LanguageSwitch lang={lang} rest={rest} dict={dict} />
            <ThemeToggle dict={dict} />
          </div>
        </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              aria-current={i.active ? "page" : undefined}
              className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${i.active ? "text-accent" : "text-muted"}`}
            >
              <span className={`relative flex h-7 w-12 items-center justify-center rounded-full ${i.active ? "bg-accent-soft" : ""}`}>
                <i.icon className="size-5" strokeWidth={1.75} aria-hidden />
                {Boolean(i.count) && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] text-accent-foreground">
                    {i.count}
                  </span>
                )}
              </span>
              {i.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}

function Count({ n, active }: { n: number; active: boolean }) {
  return (
    <span
      className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[11px] ${
        active ? "bg-accent-foreground/20" : "bg-info-soft text-info"
      }`}
    >
      {n}
    </span>
  );
}

function LanguageSwitch({ lang, rest, dict }: { lang: Locale; rest: string; dict: Dict }) {
  return (
    <div className="flex h-10 items-center rounded-full bg-surface-low p-1 font-mono text-xs">
      {LOCALES.map((l) =>
        l === lang ? (
          <span key={l} className="flex h-8 items-center rounded-full bg-card px-2.5 font-semibold text-accent shadow-sm">
            {l.toUpperCase()}
          </span>
        ) : (
          // Keep the query string so a shared results link stays intact when switching language.
          <a
            key={l}
            href={`/${l}${rest || "/"}`}
            hrefLang={l}
            className="flex h-8 items-center rounded-full px-2.5 text-muted hover:text-foreground"
            onClick={(e) => {
              e.currentTarget.href = `/${l}${rest || "/"}${window.location.search}`;
            }}
          >
            {l.toUpperCase()}
            <span className="sr-only"> ({dict.nav.language})</span>
          </a>
        ),
      )}
    </div>
  );
}

/** Cycles system → light → dark. */
function ThemeToggle({ dict }: { dict: Dict }) {
  const raw = useStored("local", THEME_KEY);
  const theme = parseTheme(raw);

  // Follows changes from other tabs; the layout's inline script covers the first paint.
  useEffect(() => {
    if (raw === undefined) return;
    if (theme) document.documentElement.setAttribute("data-theme", theme);
    else document.documentElement.removeAttribute("data-theme");
  }, [raw, theme]);

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const next = theme === null ? "light" : theme === "light" ? "dark" : null;
  const label = dict.nav.theme[theme ?? "system"];
  return (
    <button
      type="button"
      onClick={() => saveTheme(next)}
      title={label}
      className="flex size-10 items-center justify-center rounded-full text-muted hover:bg-surface-low hover:text-foreground"
    >
      <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      <span className="sr-only">{label}</span>
    </button>
  );
}
