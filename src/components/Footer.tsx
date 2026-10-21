import type { Dict } from "@/lib/i18n";

export function Footer({ dict }: { dict: Dict }) {
  return (
    <footer className="hidden border-t border-border bg-surface-low sm:block">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-5 text-sm text-muted lg:px-8">
        <p>© {new Date().getFullYear()} Cargregator · {dict.footer.tagline}</p>
        <p className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-success" aria-hidden />
          {dict.footer.note}
        </p>
      </div>
    </footer>
  );
}
