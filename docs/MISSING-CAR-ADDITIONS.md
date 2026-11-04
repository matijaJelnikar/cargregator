# Missing-car additions

The Legacy IV pilot has been loaded by Matija and its writing style approved. The read-only production snapshot on 2026-11-03 now contains 822 generations, including all three batch-001 additions; the [candidate backlog](MISSING-CAR-CATALOGUE.md) contains 168 absent entries. This is an initial European coverage audit, not an exhaustive list of every car. The three Subaru additions are confirmed loaded by a read-only check. Remaining candidates stay absent until their insertion is verified.

## Batch 001 — loaded; image workflow completed

| Generation | Years | Engine variants | Engine assessments | Inspection risks | Buying checks |
| --- | --- | --- | --- | --- | --- |
| Subaru Forester II (SG) | 2002–2008 | 6 | 4 | 3 | 8 |
| Subaru Impreza II (GD/GG) | 2000–2007 | 8 | 7 | 4 | 8 |
| Subaru Outback III (BP) | 2003–2009 | 5 | 4 | 3 | 8 |

Local SQL, intentionally gitignored: `data-raw/carinfo/sql/missing-cars-20261103-001.sql`. Its adjacent `.sql.manifest.json` records target identities and the SHA-256 checksum.

Full bilingual previews, source audits and checked evidence are under `data-raw/carinfo/additions/20261103-batch-001/`, in directories `subaru-forester--sg`, `subaru-impreza--gd` and `subaru-outback--mk3`. Read each `preview.md` for the complete text. Matija loaded these three reports. The retained SQL has since been regenerated with image fields in the INSERT for fresh databases; re-running it preserves the existing production rows. Codex has not executed Supabase writes.

Research uses European Subaru brochure tables, original road tests, repair specialists and explicitly scoped owner reports. Overseas material supports matching mechanical mechanisms only; uncertain European applicability is marked weak. These are direct source checks by Codex, without Claude or an independent second-model review. Scores and likelihood categories are editorial judgements, not measured failure rates. Unsupported local repair prices, annual costs and inherited crash-test ratings are left unknown. Recall coverage has not been added. Every addition must also include a generation-matched, visually reviewed photo with source, author and licence. The batch photos are downloaded and visually reviewed as `photo.webp`, with attribution in `photo.json`. All three public R2 URLs were checked. Future addition SQL includes all image fields directly in the generation INSERT. Forester is already attached in production; for the two existing image-less rows, the explicit correction is `data-raw/carinfo/sql/missing-cars-20261103-001-existing-images.sql` (Matija runs it; existing photos are preserved).

The exporter validates report completeness and existing taxonomy, rejects duplicate targets and alternate generation aliases, and uses one transaction for the entire batch. Existing exact targets are preserved, including manual edits and reviewed or hidden rows. A disposable PostgreSQL 16 database verified the first insertion, exact counts, repeat safety, sibling preservation, manual-edit protection, full rollback on a late alias collision and loader-failure rollback. No Supabase writes were used in validation.

To regenerate from the retained local research files:

```sh
node scripts/carinfo/addition-batch.ts data-raw/carinfo/additions/20261103-batch-001 data-raw/carinfo/catalogue-audit/snapshot-20261103-approved.json data-raw/carinfo/sql/missing-cars-20261103-001.sql
```

Fetch photos before database insertion with:

```sh
node scripts/carinfo/images.ts fetch-additions data-raw/carinfo/additions/20261103-batch-001
```

Visually check each `photo.webp` and retain attribution in `photo.json`. For a rejected selection, put its Wikimedia filename in the directory's `photo-rejected.json` array and remove `photo.json` before retrying. This command only downloads files; it does not publish to R2 or mutate the database. Publish reviewed photos before exporting SQL:

```sh
IMG_BASE=https://cars-img.jelnikar.dev node scripts/carinfo/images.ts upload-additions data-raw/carinfo/additions/20261103-batch-001
```

This uses existing matching uploads or generation keys independent of database IDs, verifies the public image response, and records the URL. The addition exporter requires reviewed, uploaded, correctly attributed photo metadata and embeds all four image columns in the INSERT. Matija runs only the resulting combined SQL for new additions.

## Batch 002 — Golf IV ready, including photograph

Local SQL: `data-raw/carinfo/sql/missing-cars-20261103-002.sql`. This inserts Golf IV (`volkswagen-golf/mk4`, 1997–2006 including the estate), 21 engine variants, 14 engine assessments, four inspection risks and eight checks. The same generation INSERT includes its verified public R2 photo URL, credit, CC0 licence and source URL. No separate image SQL is needed for this new addition.

Full bilingual preview: `data-raw/carinfo/additions/20261103-batch-002/volkswagen-golf--mk4/preview.md`. Manufacturer tables separately cover hatchback, GTI and estate; CNG is distinct from LPG and the Mk3-derived Cabriolet is excluded. Fault evidence is an original specialist inspection guide; it does not establish fleet incidence. Engine scores remain editorial and costs unknown.

Disposable PostgreSQL validation passed exact counts, image attribution, repeat safety, manual-edit and sibling protection, alias rejection and rollback on a loader failure. The photo was downloaded, visually checked, uploaded to R2 and publicly verified. No Supabase writes were executed by Codex. This car remains part of the 168 absent candidates until Matija loads the SQL; 167 other candidates remain unresearched.

## Next research

Volkswagen Golf V, Passat B6 and Polo IV are the next priority. Manufacturer engine tables have been located; report text and variant-specific mechanical claims still need verification. They are not included in either prepared batch. Missing taxonomy models require separate verified model additions before generation import.

Continue with full reports in verified batches, preserving the approved Legacy style. Database insertion remains Matija's step. Refresh the read-only snapshot after loading a batch before updating catalogue counts.
