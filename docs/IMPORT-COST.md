# Import cost check

Page: `/[lang]/check` (`src/components/CheckCar.tsx`). Without a car in the URL it shows **My cars**
(`MyCars.tsx`): a box to add a car by its listing link and the cars checked so far, cheapest total first.
With a car (`?u`/`?tx`/`?ti` shared link, `?car=<id>` saved car, `?manual=1`) it shows the calculator: the
user types what the listing shows (make, model, fuel, power, first registration, mileage, price); CO2 and
the emission class are filled in from EU registration data ([CO2.md](CO2.md)). Make, model, fuel and a
single year are prefilled from the search and the link. Nothing is fetched from the listing site.

## Sharing a listing back: `src/lib/listing.ts`

The flow: search here → open a site → find a car → bring its link back → see the import cost → save it.

- **Paste** (every platform): link box on My cars, with a Paste button where the clipboard API allows it.
- **Android share sheet**: `src/app/manifest.ts` declares a Web Share Target (`GET /share/?u&tx&ti`).
  `public/share/index.html` forwards to `/{lang}/check/` like `public/index.html` does. It only works once
  the user has installed the app (browser menu → Install app). iOS has no share targets, so iPhone users paste.
- **What we read**: only the URL and the text the share sheet or the user hands us, never the page itself
  (the sites' terms forbid fetching or extracting it, see PLAN.md §11). Many apps put the link inside
  `text`, so the first `http(s)` URL anywhere wins; other schemes are rejected.
- **Prefill**: site → country (mobile.de DE, willhaben AT, njuškalo HR, AutoScout24 by its domain), make and
  model from the URL slug, the search a mobile.de link still carries (`ms=<make>;<model>`, `ft=<fuel>`; only
  for model ids `mobilede.ts` knows) or the share text (BMW 320d → 3 Series, Mercedes C 220 → C-Class), fuel words,
  and the first euro amount in the share text. All of it is editable.
- **avto.net** links (and the country "Slovenia (no import)") mean the car is already here: no VAT or DMV,
  the total is the price.
- **Saved cars** live in localStorage (`cargregator:cars`), with the automatic CO2 figures they were saved
  with, so the list doesn't need the CO2 data. Totals are recomputed on every view because DMV depends on
  the date.

| Site | URL pattern we expect | Verified? |
|---|---|---|
| mobile.de | `suchen.mobile.de/fahrzeuge/details.html?id=<id>`, `/auto-inserat/<slug>/<id>.html` | no |
| AutoScout24 | `autoscout24.<tld>/angebote/<make>-<model>-…-<uuid>` (`/offers/`, `/annunci/`, …) | no |
| willhaben | `willhaben.at/iad/gebrauchtwagen/d/auto/<slug>-<id>/` | no |
| njuškalo | `njuskalo.hr/auti/<slug>-oglas-<id>` | no |
| avto.net | `avto.net/Ads/details.asp?id=<id>` | partly (seen on the avto.net homepage) |

Still to check by hand: real share payloads from each site's app and from Chrome (which field carries the
link, what the text looks like), then update the patterns and `listing.test.ts`.

## Motor vehicle tax (DMV): `src/lib/dmv.ts`

Source: **ZDMV-1**, Uradni list RS 192/2020, in force since 1 Jan 2021 (articles 9–16). Checked
against the law text on 21 Oct 2026; re-check PISRS for amendments before relying on it.

- Tax = CO2 part (art. 10) + Euro norm part (art. 14), in euros, not a percentage of the price.
- Hybrids, LPG and CNG use the petrol scale; diesel hybrids would use the diesel scale (the app has
  no diesel-hybrid fuel). Fully electric cars pay 0 € (art. 12).
- NEDC only → × 1.22 (petrol and others) or × 1.20 (diesel), rounded (art. 11).
- No CO2 figure → 1.5 × the top band's minimum: 2,247 € petrol, 2,695.50 € diesel (art. 10(4)).
- No Euro norm → Euro 0 (art. 14(4)). Euro 6d-TEMP isn't named in the law; we use the 6c amount.
- 8+ seats (7 besides the driver's) → −30 % (art. 15(1)). The commercial-vehicle −30 % (art. 15(2))
  isn't offered.
- Used cars pay a share by age since first registration: 91 % (up to 1 year) … 33 % (over 10 years)
  (art. 16).

## VAT and other costs: `src/lib/landedCost.ts`

- Private buyer only. A car up to 6 months since first registration **or** up to 6,000 km is a "new
  means of transport": bought net, 22 % VAT paid in Slovenia. Otherwise the listed price is paid as is.
- Transport (250 €) and inspection and registration (250 €) are editable rough estimates, not tariffs.
