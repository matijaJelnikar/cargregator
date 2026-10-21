import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { LOCALES } from "@/lib/i18n";
import { THEME_KEY } from "@/lib/storage";
import { getDictionary } from "./dictionaries";
import "../globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin", "latin-ext"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin", "latin-ext"] });

// Applies a theme chosen in this browser before the first paint (no light flash in dark mode).
const themeScript = `try{var t=JSON.parse(localStorage.getItem(${JSON.stringify(THEME_KEY)}));if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

// Static export: only the generated locales exist.
export const dynamicParams = false;

export async function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { dict } = await getDictionary((await params).lang);
  return { title: dict.meta.title, description: dict.meta.description };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang, dict } = await getDictionary((await params).lang);
  return (
    <html lang={lang} className={`${jakarta.variable} ${jetbrains.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <Nav lang={lang} dict={dict} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-32 pt-6 sm:px-6 sm:pb-12 sm:pt-8 lg:px-8">{children}</main>
        <Footer dict={dict} />
      </body>
    </html>
  );
}
