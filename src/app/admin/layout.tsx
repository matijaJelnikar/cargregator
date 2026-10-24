import type { Metadata } from "next";
import Link from "next/link";
import "../globals.css";

// Review site: Slovenian only, never indexed, outside [lang] (its own root layout).
export const metadata: Metadata = { title: "Cargregator: pregled", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="sl" className="h-full antialiased">
      <body className="min-h-full bg-background font-sans text-foreground">
        <header className="border-b border-border bg-card">
          <nav className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-3 text-sm sm:px-6">
            <Link href="/admin/" className="font-semibold">
              Cargregator · pregled
            </Link>
            <Link href="/admin/" className="text-muted hover:text-foreground">
              Vrsta
            </Link>
            <Link href="/admin/reports/" className="text-muted hover:text-foreground">
              Prijave napak
            </Link>
          </nav>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
