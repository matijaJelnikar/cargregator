# Missing-car additions

The Legacy IV pilot has been loaded by Matija and its writing style approved. The read-only production snapshot on 2026-11-03 contains 819 generations; the [candidate backlog](MISSING-CAR-CATALOGUE.md) contains 171 absent entries. This is an initial European coverage audit, not an exhaustive list of every car. Of those 171 entries, three have a prepared SQL batch; 168 still require research. Prepared additions remain absent until Matija loads them.

## Batch 001 — ready for local review and insertion

| Generation | Years | Engine variants | Engine assessments | Inspection risks | Buying checks |
| --- | --- | --- | --- | --- | --- |
| Subaru Forester II (SG) | 2002–2008 | 6 | 4 | 3 | 8 |
| Subaru Impreza II (GD/GG) | 2000–2007 | 8 | 7 | 4 | 8 |
| Subaru Outback III (BP) | 2003–2009 | 5 | 4 | 3 | 8 |

Local SQL, intentionally gitignored: `data-raw/carinfo/sql/missing-cars-20261103-001.sql`. Its adjacent `.sql.manifest.json` records target identities and the SHA-256 checksum.

Full bilingual previews, source audits and checked evidence are under `data-raw/carinfo/additions/20261103-batch-001/`, in directories `subaru-forester--sg`, `subaru-impreza--gd` and `subaru-outback--mk3`. Read each `preview.md` for the complete text. No remote database mutation has been executed for this batch.

Research uses European Subaru brochure tables, original road tests, repair specialists and explicitly scoped owner reports. Overseas material supports matching mechanical mechanisms only; uncertain European applicability is marked weak. These are direct source checks by Codex, without Claude or an independent second-model review. Scores and likelihood categories are editorial judgements, not measured failure rates. Unsupported local repair prices, annual costs and inherited crash-test ratings are left unknown. Recall coverage has not been added. Every addition must also include a generation-matched, visually reviewed photo with source, author and licence. The batch photos are downloaded locally as `photo.webp`, with attribution in `photo.json`; R2 publication and image-link SQL are still pending, so the report insertion SQL alone does not attach photos.

The exporter validates report completeness and existing taxonomy, rejects duplicate targets and alternate generation aliases, and uses one transaction for the entire batch. Existing exact targets are preserved, including manual edits and reviewed or hidden rows. A disposable PostgreSQL 16 database verified the first insertion, exact counts, repeat safety, sibling preservation, manual-edit protection, full rollback on a late alias collision and loader-failure rollback. No Supabase writes were used in validation.

To regenerate from the retained local research files:

```sh
node scripts/carinfo/addition-batch.ts data-raw/carinfo/additions/20261103-batch-001 data-raw/carinfo/catalogue-audit/snapshot-20261103-approved.json data-raw/carinfo/sql/missing-cars-20261103-001.sql
```

Fetch photos before database insertion with:

```sh
node scripts/carinfo/images.ts fetch-additions data-raw/carinfo/additions/20261103-batch-001
```

Visually check each `photo.webp` and retain attribution in `photo.json`. For a rejected selection, put its Wikimedia filename in the directory's `photo-rejected.json` array and remove `photo.json` before retrying. This command only downloads files; it does not publish to R2 or mutate the database. Existing database generations continue to use the established UUID-based `images.ts fetch/upload/sql` flow after insertion.

## Next research

Volkswagen Golf IV/V, Passat B6 and Polo IV are the next priority. Manufacturer engine tables have been located; report text and variant-specific mechanical claims still need verification. They are not included in batch 001. Missing taxonomy models require separate verified model additions before generation import.

Continue with full reports in verified batches, preserving the approved Legacy style. Database insertion remains Matija's step. Refresh the read-only snapshot after loading a batch before updating catalogue counts.
