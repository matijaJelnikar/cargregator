# CO2 and emission class: filled in automatically

The import page asks only for what every listing shows: make, model, fuel, **power**, first registration,
mileage and price. CO2 (with its cycle) and the emission class are filled in; the user can change them.
No AI is involved anywhere: not on the site, not in the data build.

## Where the figures come from

| Field | Source |
|---|---|
| CO2, WLTP or NEDC | **EEA "Monitoring of CO2 emissions from passenger cars"** (Regulation (EU) 2019/631, art. 7): every car registered in the EU, with its type-approval CO2, fuel and engine power. Queried through DiscoData (`discodata.eea.europa.eu/sql`), 2011–2025 |
| Emission class | From 2023 on, the EEA `Ech` column. Before that, the date rule: the norm every newly registered car had to meet at the first registration (Euro 4 from Jan 2006, 5 from Jan 2011, 6 from Sep 2015, 6c from Sep 2018, 6d-TEMP from Sep 2019, 6d from Jan 2021). Worst case, which is also the safe side for the tax |
| Diesel hybrid (diesel DMV scale) | EEA fuel type: a hybrid with a diesel engine |

## Lookup (`src/lib/co2.ts`, `lookupCo2`)

Data: one row per **model, fuel, kW and registration year** with the registration-weighted median CO2
(WLTP and NEDC), the number of cars and, from 2023, the most common Euro norm. One file per make in
`src/data/co2/<makeId>.json`, loaded only for the make being viewed.

1. Rows of the model with the same fuel and power within max(2 kW, 3 %) (rounding differs between countries
   and between kW and hp).
2. The car's registration year, or the nearest year within 3 that has data (a new car uses today's date).
3. NEDC for cars first registered before September 2018, WLTP after, since that is what their papers carry.
   If that cycle is missing, the other one.
4. Several rows (e.g. 2WD and 4WD with the same power): the registration-weighted median.
5. **Hybrids**: the EU data has the combustion engine's power, listings usually the system power, so when
   the power doesn't match, all power levels of that model and fuel are used and the page says so.

The page shows where the figure comes from ("EU registrations of the VW Golf, diesel, 110 kW, registered in
2019 (4,000 cars)"). If the user types their own CO2 or emission class, theirs is used; "Use the automatic
values" goes back. Saved cars keep the figures they were saved with, so the list doesn't load the data.

## Building the data (by hand, output committed)

```bash
node scripts/co2/ingest.ts volkswagen bmw   # EEA → data-raw/eea/groups/<makeId>.json, ~30 s per make
node scripts/co2/build.ts                   # → src/data/co2/*.json + index.ts, reports in data-raw/co2/reports/
```

- `ingest.ts` (`eea.ts`): one SQL query per year and make (`MAKE_PATTERNS` lists how each make is spelled in
  the EEA data), grouped by commercial name, type, fuel, kW, cc and each CO2 value, so every group keeps a
  CO2 histogram. Groups under 10 cars a year are dropped. NEDC values reported after 2020 are junk and not
  kept; 2010 is left out because it has no engine power.
- `build.ts`: commercial name → our model by **plain rules** (`names.ts`, tested): the longest model name
  first; "520D" → 5 Series, "C 220 D" / "C-KLASSE" → C-Class; names glued to the drivetrain or body
  ("X3XDRIVE20D", "A4AVANT") or the make ("LEXUSCT200H"); number-only models (208, Mazda 3) only as the
  first word. Rows under 20 cars are dropped; a WLTP/NEDC ratio outside 1.0–1.45 drops the implausible
  figure. **Names that match no rule are not guessed**: they go to the report with their registrations.
- `normalize.ts`: EEA fuel type + fuel mode → our fuel and DMV scale; EEA emission codes → our Euro norms.

Coverage on 21 Oct 2026: 80–100 % of each make's EU registrations matched (most 93–99 %). What is left is
mostly models we don't list (BMW iX1, M4, VW ID.7, Beetle) and electric cars, which need no CO2. To raise
it, read `data-raw/co2/reports/<makeId>.md` and add a rule to `names.ts` with a test.

Spot checks (brochure figures from memory): Golf 7 2.0 TDI 110 kW 2016 → 112 NEDC; Golf 8 2.0 TDI 110 kW
2021 → 122 WLTP; Golf GTI 180 kW 2021 → 170 WLTP; Touareg 3.0 TDI 150 kW 2016 → 173 NEDC; Octavia 2.0 TDI
110 kW 2018 → 118 NEDC; BMW 320d mild hybrid 2022 → diesel scale.
