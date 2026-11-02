## Audit and prevention
- [x] Compare all exported reports with public engine/failure rows.
- [x] Identify and review exceptional engine-name typos.
- [x] Canonicalise names and fail export on unknown/duplicate/missing assessments or invalid failure references.
- [x] Separate canonical engine names from code metadata in prompts.
- [x] Prepare a strict loader migration with reviewed/hidden protection and actual affected-row counts.

## Repairs and validation
- [x] Generate guarded local SQL for 3,553 assessments and 1,262 failure links.
- [x] Validate all SQL in an isolated PostgreSQL 16 database.
- [x] Check idempotency and protection of reviewed/hidden/edited rows.
- [x] Typecheck, lint and 174 unit tests.
- [x] Document the four genuinely omitted engine names.
- [ ] (Matija) Apply the loader migration and 21 repair batches — Supabase write; explicit approval required.
- [ ] Verify production recommendations and failure associations after application.
- [ ] Add sourced assessments for the four omitted engine names.
