# Site Adapters

Every supported site implements one interface (`src/lib/sites/types.ts`):

```ts
export type LocationSupport = "exact" | "approximate" | "country";

export interface SiteAdapter {
  id: string;                 // "mobilede"
  name: string;               // "mobile.de"
  countries: string[];        // countries the site's listings are in, e.g. ["DE"]
  location: LocationSupport;
  /** Filters this site can apply; everything else is listed on the card as "not applied". */
  supports: FilterKey[];
  /** One or more search URLs on the site's own domain (several when using anchor cities). */
  buildLinks(filters: SearchFilters, ctx: LinkContext): SiteLink[];
}
```

Range ("is this site's country inside the circle?") is computed once in `src/lib/geo.ts` from
`countries`, so adapters only build URLs.

## Per-site research template

Copy this to `docs/sites/<id>.md` while verifying links by hand (Milestone 2).

| Filter | Parameter | Example | Verified? | Notes |
|---|---|---|---|---|
| Make / model | | | | numeric IDs? |
| Year from/to | | | | |
| Price from/to | | | | |
| Max mileage | | | | |
| Power from | | | | kW or hp? |
| Fuel | | | | value codes |
| Gearbox | | | | value codes |
| Body type | | | | value codes |
| Seller type | | | | |
| Location | | | | postcode? region? |
| Radius | | | | allowed values (e.g. 50/100/200 km) |
| Sort newest | | | | |

How to verify: set the same search by hand on the site, copy the URL from the address bar, and
compare it with what the adapter generates. No automated requests to the sites.
