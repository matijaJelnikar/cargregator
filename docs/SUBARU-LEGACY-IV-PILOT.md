# Subaru Legacy IV quality-review pilot

Prepared 2026-11-03 at Matija's request. One car only; further report writing and insertions wait for his comparison with the Sonnet content. Research, writing and checking were performed directly by Codex, without Claude or OpenCode model calls for this pilot.

## Files to review and insert

- Full Slovenian/English text: `data-raw/carinfo/pilots/subaru-legacy-iv/preview.md`.
- SQL for Matija's Supabase SQL editor: `data-raw/carinfo/sql/pilot-subaru-legacy-iv-20261103.sql`.
- Structured inputs: `skeleton.json`, `answer.json`, `checked.json` in that pilot directory.
- SQL generator: `node scripts/carinfo/new-generation.ts data-raw/carinfo/pilots/subaru-legacy-iv data-raw/carinfo/sql/pilot-subaru-legacy-iv-20261103.sql`.

The SQL has **not** been run against Supabase. It inserts `subaru-legacy/bl-bp`, named **Legacy IV**, chassis **BL/BP**, 2003–2009. The existing Legacy V and VI stay unchanged. Expected output: status `ai_checked`, provenance `codex/direct-source-pilot 2026-11-03`, **11 engine rows, eight distinct assessments, six failure entries, eight inspection checks and seven reference links**.

After insertion, open `/sl/avti/subaru/legacy/#bl-bp` and `/en/avti/subaru/legacy/#bl-bp` (the generation selector also finds it). Review natural Slovenian wording, usefulness of engine choices, specificity of the risks, English parity, and how the text compares with an existing Sonnet-written generation. Public fetching can be cached during local development; production's current OpenNext configuration reads fresh data.

No photo or recall rows are added. A missing photo uses the existing placeholder. No recall rows does **not** establish that the car is recall-free. The pilot includes a VIN-check instruction. No Euro NCAP result is assigned: the later Legacy's 2009 result must not be carried across to BL/BP.

## Research decisions

The European brochure archive establishes the catalogue rather than a language model's memory. Power variants remain distinct; saloon/estate and gearbox duplicates are merged. Spec.B keeps its performance badge. The LPG rows are explicitly conversions offered in Europe, not a claim of a separate factory engine design. Registration counts are zero because there is no measured EEA count for this supplement.

| Reference | Used for |
| --- | --- |
| [Subaru MY2005 brochure](https://www.subaru.de/hubfs/Service%20und%20Zubeh%C3%B6r/Prospektarchiv/Legacy/Legacy_MJ2005_PTA.pdf?hsLang=de) | Early petrol variants and transmission/equipment distinctions. |
| [Subaru MY2006 brochure, valid September 2005](https://www.subaru.de/hubfs/Service%20und%20Zubeh%C3%B6r/Prospektarchiv/Legacy/Legacy_MJ2006_PTA.pdf?hsLang=de) | 121 kW 2.0R and six-cylinder options. |
| [Subaru MY2008 brochure](https://www.subaru.de/hubfs/Service%20und%20Zubeh%C3%B6r/Prospektarchiv/Legacy/Legacy_MJ2008_PTA.pdf?hsLang=de) | Later power revisions, diesel and optional ecomatic LPG. |
| [Subaru's Legacy history](https://www.subaru-presse.de/pressemitteilungen/30-jahre-subaru-legacy-raum-fuer-neues-allrad-denken) | Fourth generation and 2008 diesel introduction; CVT belongs to the successor. |
| [Avto magazin's 2006 test](https://avto-magazin.metropolitan.si/avtomobilski-testi/subaru-legacy-station-wagon-20-ec/) | Firsthand Slovenian driving/practicality observations. |
| [Avto magazin's 2005 test](https://avto-magazin.metropolitan.si/avtomobilski-testi/subaru-legacy-sedan-20-awd/) | Early 101 kW petrol and saloon limitations. |
| [Avto magazin's 2007 Bi-Fuel test](https://avto-magazin.metropolitan.si/avtomobilski-testi/subaru-legacy-bi-fuel-20-sw/) | Local importer conversion, not an assumed US/Japanese variant. |
| [Slovenian used-car guide](https://avto-magazin.metropolitan.si/nasveti/rabljen-avto-subaru-legacy-2003-2009-odpelje-vas-kamor-hocete/) | Oil and LPG inspection leads; its positive diesel opinion is not treated as proof of no engine risk. |
| [RJES technical guidance](https://rjes.com/subaru-flywheel-types/) and [clutch-maker bulletin](https://www.australianclutch.com.au/uploads/tech-bulletins/TSB-DMF01_ClutchPro.pdf) | DMF application and wear mechanism; no fleet failure rate. |
| [First-person 2008 Legacy diesel account](https://uk.subaruownersclub.com/forums/topic/175-diesel-engine-failure/) | A documented bearing-failure case; marked **weak**, not generalised into a quantified epidemic. |

Brochure/model-year windows are a conservative European reference set, not exact sale dates for every country. Petrol family codes remain null because the selected manufacturer tables do not establish every subtype. The diesel uses EE20. Further market/code research can extend the catalogue after the quality review; US/Japanese turbo imports are outside this pilot.

Engine scores and recommendations are editorial judgements required by the existing report contract, not manufacturer reliability statistics. The diesel is `ok`, 5/10, with an explanation of the uncertainty; no unsupported `avoid` verdict is introduced. Repair and annual costs remain null instead of converting old foreign prices into invented current Slovenian quotes. Likelihood categories are qualitative editorial assessments, not measured percentages. The existing import confidence formula is reused; its score is not a human-review badge.

## Insertion safety and validation

`new-generation.ts` validates the report schema, short labels, complete per-failure checks, engine-name coverage, variant uniqueness and year bounds. It uses the existing guarded `load_report` only after inserting the new parent and engine rows in the same transaction.

It deliberately does **not** call `load_skeleton`: that function removes sibling skeleton rows absent from its payload. A partial-model pilot must not use that loader.

Local PostgreSQL 16 validation against the repository schema and guarded loader passed:

- Correct insertion counts, with existing sibling generations unchanged.
- Second execution changes no content, IDs or timestamps.
- Existing reviewed, hidden or edited pilot rows are a no-op.
- An alternate `bl` slug is rejected before creating a duplicate.
- A simulated loader exception rolls back the new generation and all its engines.

The temporary PostgreSQL instance is disposable and separate from Supabase. Local validation script: `data-raw/carinfo/pilots/subaru-legacy-iv/validate.py`. The repeat test preserves an existing pilot rather than updating it; later editorial changes need a separately reviewed update, not a re-run of this insertion.
