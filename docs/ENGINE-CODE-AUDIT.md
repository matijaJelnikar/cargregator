# Engine identity audit — 2026-11-02

## Run in Supabase SQL Editor

1. Execute the entire `data-raw/carinfo/sql/repair-engine-codes-20261102.sql` file.
2. Check its ten result rows: `updated` or `already_correct` means success. `blocked: …` means the live row differs or is protected; inspect it before changing it.
3. Execute `data-raw/carinfo/sql/audit-engine-identities.sql` to obtain the remaining live research queue. Export the results if reviewing them outside the SQL Editor.

No remote database writes were performed. Network/DNS access to Supabase was unavailable.
The repair is transactional and safe to repeat. It checks model, generation, engine name,
fuel, power, old code and displacement. Reviewed/hidden engines and generations are protected.
Only `engine_code` and a missing `ccm` are assigned; existing report text, names, slugs,
power, fuel, dates and assessments are untouched. The database's existing update trigger
maintains `updated_at` for changed rows.

The page and data caches have a one-hour revalidation interval. SQL writes do not
invalidate those caches immediately. Allow cache revalidation or use the deployment's
normal cache-purge process before judging the public page.

## Verified repairs

| Model / generation | Stored engine | Rows | Before | After |
| --- | --- | ---: | --- | --- |
| Jogger / mk1 | 1.0 TCe 110, petrol, 81 kW, 999 cc | 1 | null | H5D |
| Sandero / mk3 | 1.0 TCe 110, petrol, 81 kW, 999 cc | 1 | HR10 | H5D |
| Sandero / mk3 | 1.0 TCe 90 / 100, petrol, 67 / 74 kW, 999 cc | 2 | HR10 | H4Dt |
| Sandero / mk3 | 1.0 TCe 90 / 100 Eco-G, LPG, 67 / 74 kW, 999 cc | 2 | HR10 | H4Dt |
| Jogger / mk1 | 1.0 TCe 100 Eco-G (LPG), 67 / 74 kW, 999 cc | 2 | null | H4Dt |
| Jogger / mk1 | Hybrid 140, 51 / 69 kW registration groups, 1598 cc | 2 | null | H4M |

These are engine **types/families**, not complete engine identification numbers with
suffixes. The 110's H5D is kept separate from H4Dt. H4Dt is the turbo designation used
in Dacia's manual and existing Logan/Duster records. No blanket HR10 → H4Dt replacement
or H4D → H4Dt replacement is safe. Hybrid registration powers are preserved; this
patch does not verify or relabel the reported combustion/electric/system power.

### Evidence checked

- [Dacia Jogger technical sheet](https://www.dacia.rs/CountriesData/Serbia/images/pdf/pricelist/jogger-pricelist.pdf): H5D for TCe 110, H4D for ECO-G 100, H4M for Hybrid 140, plus displacements and LPG/petrol power figures.
- [Dacia Sandero III manual](https://www.user-manual.dacia.com/it/content/sandero-sandero-stepway/technical-specifications/information-about-vehicle/identificazione): distinguishes H4Dt and H5D under 1.0 TCe, both 999 cc.
- [Dacia Sandero/Stepway technical sheet, June 2022](https://media.dacia.com/wp-content/uploads/2022/07/08f707cf52f86dc7ae62ab61ff61071c-keeexed.pdf): Stepway TCe 110 is the direct-injection 81 kW version; TCe 90/ECO-G have indirect injection.
- [Hengst application catalogue](https://catalog.hengst.com/de/online-katalog/produkt/12604310000-01/): Sandero III TCe 100 is H4D 480, 74 kW.
- [Hengst application catalogue](https://catalog.hengst.com/de/online-katalog/produkt/9854310000-00/18h/): Sandero III TCe 110 is H5D 490, 81 kW, from July 2022.

Some aftermarket catalogue entries disagree on the 110's type; the manufacturer
distinction takes precedence. We do not copy the suffix 490 to every production year.

## Database-wide findings and limits

Audited the existing public snapshot (818 generations, 6,893 engines) and enriched its
identities with archived skeleton/knowledge imports (421 models, also 6,893 engines).
These are local historical records, not a fresh live database export.

- 2,674 rows lack engine codes in the snapshot.
- 542 of those are electric; a combustion engine code is not expected there.
- 2,132 non-electric rows lack codes before this patch; 2,127 remain after the five null-code repairs.
- The other five repairs correct Sandero's overbroad HR10 label.
- The local SQL audit after repairs also flags 1 missing/invalid displacement,
  14 code-formatting candidates, 16 missing-code variants whose same-generation
  siblings have codes, and 185 broad/multiple-code candidates. Categories overlap.

This is **not a complete backfill of the catalogue**. No code is inferred from name,
fuel, displacement or power alone. The unresolved rows require model/year-specific
evidence. For example, Jogger's petrol-labelled `1.0 TCe 100` at 67 kW is left for review
because the label/power could describe a misclassified ECO-G registration.

The local missing-code queue is saved at
`data-raw/carinfo/engine-code-audit/missing-combustion-codes.json` (before this patch).
The SQL audit produces the current authoritative queue and orders it by registrations.
Large outstanding groups include Ford EcoBoost, Opel and Hyundai engines.

## Prevention and validation

`scripts/carinfo/engine-codes.ts` holds the scoped, verified correction registry.
Both skeleton import paths apply those corrections before export and report missing
non-electric codes/displacements. New or manually refined codes are preserved.
Regenerate the repair file with:

```sh
node scripts/carinfo/export-engine-code-repairs.ts
```

The SQL was executed in isolated PostgreSQL 16 single-user mode against all 6,893
archived rows, with code values reconciled to the snapshot where unambiguous.
It changed exactly ten rows; the second pass changed none. Tests also exercised
reviewed engines, hidden generations, manually changed codes, unexpected fuel or
displacement, and filling a missing displacement. The read-only audit executed
successfully on the same fixture. No production credentials or database were used.
