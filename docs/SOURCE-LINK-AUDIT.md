# Periodic report-source audit

`scripts/carinfo/check-links.ts` implements the source-monitoring task in `set-report-content-policy`. It reads published failures with the public key, checks source URLs, and writes local artifacts. It never authenticates as an admin or executes SQL.

```bash
# Full public snapshot and audit, with four concurrent requests by default
node scripts/carinfo/check-links.ts

# Smaller diagnostic run; untested sources stay unknown
node scripts/carinfo/check-links.ts --max-urls 100 --timeout 15000

# Recheck a previously saved failure snapshot
node scripts/carinfo/check-links.ts --snapshot data-raw/carinfo/link-audit/<stamp>/snapshot.json
```

Use `--concurrency <n>` to limit parallel requests and `--timeout <milliseconds>` for each request. Values must be positive integers. The script prints progress every 25 URLs. A full run starts a new snapshot and output directory; it does not overwrite past audits.

## Decisions made by the script

- Deduplicate URLs after removing fragments. Preserve query strings.
- Use GET, following redirects. Successful content responses count as reachable; this is an HTTP check, not a review of whether the text supports a claim.
- Treat 202, 204 and 205 as unknown: accepted or empty responses do not establish source availability.
- Only two consecutive 404/410 responses establish a dead URL.
- Leave authentication failures, bot blocks, rate limits, server errors, timeouts, network failures and invalid URLs unknown.
- A failure becomes a cleanup candidate only when every source is confirmed dead. Any live or unknown/unchecked source prevents automatic cleanup.
- Do not prepare cleanup SQL for a reviewed failure or a child of a reviewed generation.

The generated statements check the failure ID, generation ID, AI-checked status, source array, title, body, and original `updated_at`. They also require the parent to remain AI-checked. Intervening edits or a later review cause the statement to do nothing. A repeat execution leaves already-hidden rows alone.

## Artifacts and application

- `data-raw/carinfo/link-audit/<stamp>/snapshot.json`: the failure rows checked, including parent status.
- `results.json`: URL statuses and timestamps, summary counts, partial/full coverage, and failures with only dead sources.
- `report.md`: human-readable summary.
- `data-raw/carinfo/sql/dead-sources-<stamp>.sql`: guarded candidate updates, generated only when there are candidates.

Before applying SQL, inspect the report and manually recheck the proposed dead sources. The whole file is transactional. Obtain Matija's explicit authorization before any Supabase execution. If a source has been restored or replaced, discard the candidate and prepare a fresh audit.

No recurring schedule is installed. Hosting and cadence are recorded as an owner question in `QUESTIONS-FOR-MATIJA.md`.

## Initial validation

The final full run on 2026-11-02 checked 2,353 URLs attached to 5,334 public failures: 2,208 reachable, 0 confirmed dead, 145 unknown. It uses the stricter empty-response classification described above and produced no SQL candidates. Results: `data-raw/carinfo/link-audit/20261102T201419Z/`.

Unit tests cover definitive versus inconclusive HTTP responses, failed confirmation, URL identity, mixed live/unknown/dead sources, reviewed-content protection, timestamp/content SQL guards, snapshot validation, and bounded request concurrency.

Generated cleanup statements also passed an isolated PostgreSQL 16 test against the real schema. Exactly two eligible fixture rows were hidden; reviewed/hidden failures and parents, changed titles/bodies/sources, and changed timestamps were preserved. A second pass was a no-op, including `updated_at`. Log: `data-raw/carinfo/link-audit/validation/postgresql-20261102.log`. The temporary database server was stopped after validation; no remote database was modified.
