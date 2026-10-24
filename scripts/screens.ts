// Screenshots of the car-guide and admin pages for a visual review: phone (390 px) and desktop (1280 px), light and
// dark, full page, saved to data-raw/screens/<name>-<width>-<scheme>.png. Needs a running server.
//
//   node scripts/screens.ts                          # against http://localhost:3000
//   BASE=https://cars.jelnikar.dev node scripts/screens.ts
//   node scripts/screens.ts golf engine              # only some pages

import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = "data-raw/screens";

const PAGES: Record<string, string> = {
  makes: "/sl/avti/",
  make: "/sl/avti/dacia/",
  golf: "/sl/avti/volkswagen/golf/",
  "no-report": "/sl/avti/dacia/jogger/",
  engine: "/sl/avti/volkswagen/golf/mk7/1-2-tsi-63kw/",
  results: "/sl/results/?make=volkswagen&model=volkswagen-golf&yf=2014&yt=2016",
  check: "/sl/check/?manual&make=volkswagen&model=volkswagen-golf&yf=2015",
  admin: "/admin/login/",
};
const WIDTHS = [390, 1280];
const SCHEMES = ["light", "dark"] as const;

const only = process.argv.slice(2);
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  for (const [name, path] of Object.entries(PAGES)) {
    if (only.length && !only.includes(name)) continue;
    for (const width of WIDTHS)
      for (const colorScheme of SCHEMES) {
        const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme });
        const res = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 120_000 });
        const file = `${OUT}/${name}-${width}-${colorScheme}.png`;
        await page.screenshot({ path: file, fullPage: true });
        // Wider than the viewport means a horizontal scroll on phones.
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        console.log(`${file} ${res?.status()}${overflow > 0 ? ` OVERFLOW ${overflow}px` : ""}`);
        await page.close();
      }
  }
} finally {
  await browser.close();
}
