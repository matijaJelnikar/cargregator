// Local browser checks for the model-page states tracked by OpenSpec. Never logs in or writes data.
// Requires a running app: node scripts/model-qa.ts (BASE defaults to http://localhost:3000).
// BASE=https://cars.jelnikar.dev OUT=data-raw/screens/production-model-states node scripts/model-qa.ts --pros-cons-only
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, type Page } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = process.env.OUT ?? "data-raw/screens/model-states";
const prosConsOnly = process.argv.includes("--pros-cons-only");
const results: Record<string, unknown>[] = [];
const pageErrors: string[] = [];

async function overflow(page: Page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "Horizontal overflow");
}
async function capture(page: Page, name: string) {
  await overflow(page);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
}
async function open(page: Page, path: string) {
  // Readiness is tied to the UI under test; unrelated background requests must not stall the check.
  const response = await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 45_000 });
  assert.equal(response?.status(), 200, `${path} did not return 200`);
  await page.locator("main").waitFor();
  await page.waitForFunction(() => document.fonts.status === "loaded", undefined, { timeout: 20_000 });
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  for (const width of [360, 1280]) for (const colorScheme of ["light", "dark"] as const) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    const label = `${width}-${colorScheme}`;
    await open(page, "/sl/avti/volkswagen/golf/");
    const toggle = page.getByRole("button", { name: "Prikaži podrobnosti", exact: true });
    await toggle.waitFor();
    assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    const collapsed = await page.locator("main").innerText();
    await capture(page, `collapsed-${label}`);
    await toggle.click();
    const less = page.getByRole("button", { name: "Prikaži manj", exact: true });
    await less.waitFor();
    assert.equal(await less.getAttribute("aria-expanded"), "true");
    assert.notEqual(await page.locator("main").innerText(), collapsed, "Toggle did not change the descriptions");
    await capture(page, `expanded-${label}`);
    await less.click();
    assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    // Selecting another generation remounts the disclosure in its collapsed state.
    await toggle.click();
    await page.getByRole("button", { name: /^Golf VII\b/ }).click();
    const reset = page.getByRole("button", { name: "Prikaži podrobnosti", exact: true });
    await reset.waitFor();
    assert.equal(await reset.getAttribute("aria-expanded"), "false");
    await capture(page, `generation-switch-${label}`);
    // This real generation has no short labels in public data. The full descriptions render without a toggle.
    await open(page, "/sl/avti/volkswagen/passat/#b9");
    await page.locator("#b9").waitFor();
    assert.equal(await page.locator("main button[aria-expanded]").count(), 0, "Missing-label fallback exposed a toggle");
    assert.ok((await page.getByRole("heading", { name: "Prednosti", exact: true }).count()) > 0);
    await capture(page, `fallback-${label}`);
    if (prosConsOnly) {
      results.push({ width, colorScheme, collapsed: true, expanded: true, generationReset: true, fallback: true, overflow: false });
      console.log(JSON.stringify(results.at(-1)));
      await page.close();
      continue;
    }
    // A public generation with no image must render a placeholder rather than a broken <img>.
    await open(page, "/sl/avti/ds/ds-3/#mk1");
    await page.locator("#mk1").waitFor();
    assert.equal(await page.locator("main figure img").count(), 0, "Missing-photo state rendered an image");
    assert.ok((await page.locator("main figure").innerText()).trim().length > 0, "Missing-photo placeholder has no label");
    await capture(page, `no-photo-${label}`);
    await open(page, "/sl/avti/audi/a6/#c9");
    await page.locator("#c9").waitFor();
    assert.equal(await page.getByRole("heading", { name: "Prednosti", exact: true }).count(), 0);
    assert.ok((await page.locator("#c9").innerText()).includes("Povzetek, prednosti in slabosti"), "No-report state has no explanation");
    await capture(page, `no-report-${label}`);
    results.push({ width, colorScheme, collapsed: true, expanded: true, generationReset: true, fallback: true, noPhoto: true, noReport: true, overflow: false });
    console.log(JSON.stringify(results.at(-1)));
    await page.close();
  }
  if (!prosConsOnly) {
    const page = await browser.newPage();
    await open(page, "/admin/login/");
    const font = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    assert.ok(font.includes("Plus Jakarta Sans"), `Admin uses the wrong font: ${font}`);
    results.push({ adminFont: font });
  }
  assert.deepEqual(pageErrors, [], "Browser runtime errors");
} finally {
  await writeFile(`${OUT}/results.json`, JSON.stringify({ checked_at: new Date().toISOString(), base: BASE, results, pageErrors }, null, 2));
  await browser.close();
}
