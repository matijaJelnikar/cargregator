# Cargregator: Implementation Plan

Status: **v1 approved, trimmed for a fast first release** (target: 1–2 weeks). The goal of v1 is to
get the link builder into the hands of 10–20 people who are buying a car right now, and learn
whether they come back. The landed-cost calculator is the next step (section 12).

## 1. Goal

One place to set car search filters, choose which sites to include, and open every site's own
results with those filters already applied. Focused on buyers in Slovenia and the surrounding region.

**Legal principle:** the app never scrapes, stores or displays listings, and never fetches the
sites' pages or result counts. It only builds links to each site's public search pages, which open
in a normal browser tab. (All five sites block framing, so no embedding either.) Lawyer review
before monetising.

## 2. Decisions

| Topic | Decision |
|---|---|
| Sites in v1 | avto.net (SI), mobile.de (DE), AutoScout24 (EU), willhaben (AT), njuškalo (HR) |
| Languages | Slovenian + English |
| Accounts | None in v1. Saved searches live in the browser; searches are shareable by link |
| Platform | Responsive web app, mobile-first |
| Domain | `cars.jelnikar.dev` on Cloudflare |
| Cost | €0 (free tiers only) |
| Backend | None in v1 (static export). Supabase later for accounts, synced searches, alerts |

## 3. Scope

**In v1**
- Filter form: make, model, first registration year from/to, price from/to (EUR), mileage to,
  power from (kW/hp), fuel, gearbox, body type, seller type (dealer/private)
- Location: pick a city from a bundled list (or "use my location"), radius 25–1000 km
- Site toggles (all on by default); sites whose country is outside the circle are marked "out of range"
- Results: one card per site with a location badge, a note on which filters that site couldn't
  apply, and an **Open** button (several buttons for mobile.de anchor cities); opened cards are ticked off
- All links sort **newest first** (no UI control)
- Saved searches (rename, delete, re-run) in the browser; share a search as a link
- Slovenian and English UI; light/dark follows the system

**Cut from v1** (was in the first draft): map, GeoNames postcode data and the full anchor
algorithm (replaced by a bundled city list), PWA/offline, shadcn/ui and react-hook-form
(plain Tailwind components), next-intl (Next.js dictionary pattern), Playwright and the weekly
link check, manual dark-mode toggle.

**Not in v1** (see roadmap): accounts, alerts, landed-cost calculator, paste-a-link shortlist,
more countries, listings inside the app.

## 4. User flow

1. Open app → filter form (last used search pre-filled)
2. Choose make → model list appears; choose other filters
3. Choose city + radius → site list updates (in range / out of range)
4. Press **Search** → results screen with one card per site
5. Press **Open** on each card → that site's results open in a new tab; the card is ticked off
6. Optionally **Save search** or **Share**

## 5. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript, **static export** (`output: 'export'`) |
| UI | Tailwind CSS 4, lucide icons |
| Validation | zod (filters parsed from the URL) |
| i18n | `app/[lang]` segment + JSON dictionaries (Next.js i18n guide), `/sl` and `/en` |
| Geo | Bundled list of ~80 cities (name, country, postcode, lat/lon); haversine distance |
| Storage | localStorage (wrapped in try/catch) |
| Tests | Vitest (URL builders, geo, filter (de)serialisation) |
| Hosting | Cloudflare Workers with static assets, deployed by Wrangler |
| Analytics | Cloudflare Web Analytics (no cookies) |

## 6. Data model

```ts
// src/lib/filters.ts (zod schema; single source of truth)
type Fuel = "petrol" | "diesel" | "hybrid" | "plugin_hybrid" | "electric" | "lpg" | "cng";
type Gearbox = "manual" | "automatic";
type Body = "sedan" | "estate" | "hatchback" | "suv" | "coupe" | "convertible" | "van" | "mpv";
type Seller = "dealer" | "private";

interface SearchFilters {
  makeId?: string;          // our own canonical id, e.g. "bmw"
  modelId?: string;         // e.g. "bmw-3-series"
  yearFrom?: number; yearTo?: number;
  priceFrom?: number; priceTo?: number;   // EUR
  mileageTo?: number;                     // km
  powerFromKw?: number;
  fuel?: Fuel[]; gearbox?: Gearbox; body?: Body[]; seller?: Seller;
  cityId?: string;          // from src/data/cities.ts
  radiusKm: number;
  sites: string[];          // enabled site ids
}

interface SavedSearch { id: string; name: string; filters: SearchFilters; createdAt: string; lastRunAt?: string }
```

**Canonical car taxonomy** (`src/data/makes.ts`): our own list of makes and models, starting with
the ~25 most common makes in the region. Each adapter maps our ids to the site's own ids/slugs.
If a site has no mapping for a model, the adapter falls back to make only (or a keyword) and the
card says "model filter not applied".

## 7. Site adapters

See [SITE-ADAPTERS.md](SITE-ADAPTERS.md). Each site lives in `src/lib/sites/<id>.ts` with a test.

**Location strategy in v1:**

| Site | Strategy | Badge |
|---|---|---|
| AutoScout24 | User's postcode + radius, countries inside the circle | **Exact** |
| mobile.de | One search: the German place + allowed radius that best matches the circle (`bestAnchor` in `geo.ts`), or all of Germany when the circle takes in most of it | **Approximate** |
| willhaben | Whole of Austria when the circle reaches it | **Country** |
| avto.net | Whole of Slovenia when the circle reaches it | **Country** |
| njuškalo | Whole of Croatia when the circle reaches it | **Country** |

"Reaches a country" = at least one bundled city or border town (`BORDER_TOWNS` in
`src/data/cities.ts`) of that country lies inside the circle.
Region-level filtering (Austrian districts, Croatian counties) comes after v1.

**Every URL parameter is unverified until checked by hand** (see M1). Each adapter test pins the
URL it generates, so a fix after manual checking is a one-line change plus an updated test.

## 8. Screens

1. **Search** (`/[lang]`): filter form, location/radius, site toggles, Search button
2. **Results** (`/[lang]/results?…`): site cards; filters are in the URL so it is shareable
3. **Saved** (`/[lang]/saved`): list of saved searches
4. **About** (`/[lang]/about`): how it works, privacy note

## 9. Project structure

```
src/
  app/[lang]/        layout, page (search), results/, saved/, about/, dictionaries
  components/        SearchForm, ResultsView, SavedList, SiteCard, Nav, ui bits
  lib/
    filters.ts       schema + URL (de)serialisation
    geo.ts           haversine, cities in circle, anchor selection
    sites/           types.ts, registry.ts, avtonet.ts, mobilede.ts, autoscout24.ts, willhaben.ts, njuskalo.ts
    storage.ts       saved searches + last search
  data/              makes.ts, cities.ts
docs/
```

## 10. Milestones

**M1 — Core logic + UI (one pass)**
- Filter schema, makes/models, cities, geo, 5 adapters with tests
- Search, results, saved and about screens in both languages
- ✅ Done when: full flow works locally on phone and desktop widths

**M2 — Verify links by hand**
- Open each site's generated link for a handful of searches in a normal browser and fix wrong
  parameters; record findings in `docs/sites/<id>.md`
- ✅ Done when: every filter on every site is either verified or listed as "not applied"

**M3 — Deploy & launch to friends**
- Cloudflare deploy via Wrangler (and GitHub Actions once the repo exists), `cars.jelnikar.dev`
- ✅ Done when: 10–20 testers use it; feedback collected

## 11. Risks

| Risk | Mitigation |
|---|---|
| Sites change URL formats | Adapters isolated + pinned tests; manual re-check when someone reports a broken link |
| URL parameters guessed wrong | M2 manual verification before launch |
| Model ID mapping is a lot of manual work | Start with top makes; fall back to make-only or keyword |
| Sites block deep links / need cookies | Fall back to the site's search page with a note |
| Little value vs. AutoScout24's own cross-border search | Regional sites + saved multi-site searches; landed-cost calculator next |
| Sites' terms (checked 21 Oct 2026) forbid scraping, extensions and reuse: avto.net Pravno obvestilo 5.2 (names browser extensions and screen scraping) and 6.2; mobile.de AGB-ÖB § 11.1 (no unauthorised search software, extraction, integration, *or linking*); AutoScout24 Nutzungsbedingungen § 8.2–8.3 (no automated queries, no meta-databases, *no linking*) | We never fetch listing pages; we only read links users send us. Plain deep links to public search pages are generally lawful (CJEU *Svensson* 2014, BGH *Paperboy* 2003); ask the lawyer to confirm given the "no linking" clauses. Listings inside the app only with written permission or dealer feeds |

## 12. After v1 (roadmap)

1. **Landed-cost calculator** (transport, export plates, Slovenian motor vehicle tax, VAT rules,
   registration): the strongest differentiator, test it right after v1. **Built**: the user enters what
   the listing shows, CO2 and emission class are filled in from EU registration data
   ([IMPORT-COST.md](IMPORT-COST.md), [CO2.md](CO2.md))
2. Paste-a-link shortlist feeding the calculator. **Built**: share or paste a listing link back, prefill
   from the link only, "My cars" list in the browser ([IMPORT-COST.md](IMPORT-COST.md))
3. Accounts + synced searches + "new cars" reminder emails (Supabase)
4. More filters (drive type, condition, damaged, VAT deductible, listing age, keyword), region-level
   location for willhaben/njuškalo, map
5. More sites: subito.it, hasznaltauto (HU), bazos
6. Dealer feeds → real listings with exact radius
