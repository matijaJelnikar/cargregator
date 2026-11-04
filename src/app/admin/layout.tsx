import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import "../globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin", "latin-ext"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin", "latin-ext"] });

// Review site: Slovenian only, never indexed, outside [lang] (its own root layout).
export const metadata: Metadata = { title: "Cargregator: pregled", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="sl" className={`${jakarta.variable} ${jetbrains.variable} h-full antialiased`}>
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
