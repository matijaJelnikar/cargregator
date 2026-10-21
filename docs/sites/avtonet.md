# avto.net

Results URL: `https://www.avto.net/Ads/results.asp?…`

## Findings

- **2026-10-21:** price wasn't applied when our link sent only ~12 parameters. The adapter now sends the
  full parameter set copied from a search built on avto.net (VW Touareg, 2016–2017, up to 200,000 km),
  overwriting only the fields we filter on. For that search our link is identical to the site's.
- Parameters we set: `znamka`, `model` (avto.net names), `cenaMin`/`cenaMax`, `letnikMin`/`letnikMax`,
  `kmMax`, `kwMin`, `presort=3&tipsort=DESC` (newest first).
- **Verified 2026-10-21:** price (`cenaMin`/`cenaMax`) works with the full parameter set.
- Unverified: `kwMin`, and the meaning of `EQ1`–`EQ12` (kept at the site's defaults).
