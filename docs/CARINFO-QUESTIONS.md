# Car guide: open questions (2026-10-22 night session)

Work done tonight is listed in "Status" at the bottom. Questions are ordered by how much they block.

## Needs you (blocking)

0. **Supabase writes waiting for your OK.** Per your instruction I stopped writing to Supabase. Already done
   before that instruction (please review):
   - migrations `carinfo_images`, `carinfo_report_links`, `carinfo_load_report` (all additive: new columns, a
     constraint, a loader function; files in `supabase/migrations/2026102200{02,03,04}00_*.sql`);
   - Golf VII report loaded with `carinfo.load_report` (generation is now `ai_checked` and public).
   Waiting for you: `data-raw/carinfo/sql/reports-*.sql` (pilot reports; each generation's call replaces its
   failures, checks and links). Run them in the dashboard SQL editor, or tell me to load them.

1. **R2 for photos.** Create bucket `cargregator`, connect a custom domain (suggested `cars-img.jelnikar.dev`),
   then `! npx wrangler login`. After that I run `node scripts/carinfo/images.ts upload` and
   `IMG_BASE=https://cars-img.jelnikar.dev node scripts/carinfo/images.ts sql` and load the SQL. OK with that domain?
2. **Commits.** Nothing is committed yet (Phase A + car profile + reports pipeline). Commit in chunks
   (schema/scripts, UI, data files) on a branch and open a PR, or straight to main like before?

3a. **Visual check.** I can't open the pages in a browser here: Playwright's Chromium is installed but needs
    `libnss3` (`! sudo apt-get install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libxkbcommon0
    libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2`). With those I can screenshot pages at phone and
    desktop width myself. Until then, please look at `/sl/avti/volkswagen/golf/` (it has a full report on Golf VII).

## Decisions (content)

3. **Report sources are mostly German** (ADAC, TÜV, gebrauchtwagenberater.de, carwiki.de). Fine, or should the
   prompt push harder for Slovenian/English sources (Avto magazin, Honest John, What Car?)?
4. **Repair cost estimates** ("for an independent garage in Slovenia") are AI estimates, not quotes. Show them
   (with the note), show only "low/medium/high cost", or hide them until reviewed?
5. **Engine verdicts** ("Avoid" in red) are the most sensitive claim. Show "Avoid" publicly while content is only
   AI-checked, or show it only after human review (keep "recommended/OK" visible)?
6. **Photo licence credits**: shown as a small line under every photo (CC BY-SA requires attribution). OK?
7. **Which model** for the full report run: Sonnet (about 2 min per generation) or Opus for the top models?
7a. **Runs differ.** Two Sonnet runs on Golf VII gave different verdicts for the 1.2 TSI ("ok" in one,
    "recommended" in the other; early 1.2 TSI camshaft issue). Options: accept (the check pass catches outright
    errors), run twice and keep only failures both runs found, or use Opus for engine verdicts.
7b. **Loading reports into Supabase** goes through the MCP: one `carinfo.load_report(...)` call per generation,
    about 14 KB each. Fine for the pilot (78 generations). For all 818, would you rather paste
    `data-raw/carinfo/sql/reports-*.sql` in the dashboard SQL editor, or keep me loading them?

## Decisions (product)

8. The ADAC breakdown statistics link goes to the general article (not per model). Keep it or drop it?
9. Euro NCAP/TÜV links are Google searches until a report finds the exact page. OK, or prefer a different search
   engine (DuckDuckGo, Bing)?
10. Makes without a logo in Simple Icons (Alfa Romeo, BYD, Cupra, Jaguar, Lancia, Land Rover, Lexus,
    Mercedes-Benz, Saab) show initials. Find SVGs elsewhere (Wikimedia Commons logos are often trademark-only,
    not freely licensed), or keep initials?

## Status
(updated at the end of the session)
