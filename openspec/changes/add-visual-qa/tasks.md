# Tasks

## 1. Browser

- [x] 1.1 (Matija) `! sudo apt-get install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2t64` (Ubuntu 24.04: libasound2t64, not libasound2)
- [x] 1.2 Confirm Playwright Chromium launches headless

## 2. Screenshots

- [x] 2.1 `scripts/screens.ts`: the pages below at 390 and 1280 px, light and dark, saved to `data-raw/screens/`
  - `/sl/avti/`
  - a make page
  - Golf (has a report)
  - a model without a report
  - an engine page
  - search results with the car-info card
  - the check-car panel
  - `/admin/login/`
- [x] 2.2 Review the screenshots; list the issues found in this file (2026-10-24, 32 shots, no horizontal overflow)
  - Fixed: Slovenian plurals ("1 generacij", "3 generacij"); now `tn()` with one|two|few|other forms
  - Fixed: a model without a report showed the same placeholder in both the pros and the cons box; now one note
  - Open: the model page repeats the selected generation (photo and summary in the hero, then again in its
    generation card); Golf is ~16,000 px tall at 390 px with three generations fully expanded
  - Open: `/admin` uses the system font, not the site's (cosmetic, admin only)
  - Not bugs: the fixed bottom nav and the Next dev badge appear mid-page in full-page shots; lazy photos below the
    fold can show as empty boxes

## 3. Fixes

- [ ] 3.1 Fix the layout issues found; re-shoot to confirm
