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
- [x] (Matija) Apply the loader migration and 21 repair batches — Supabase write; explicit approval required. Applied before this audit: all batches are archived in `data-raw/carinfo/sql/done/`; the installed loader body matches the local guarded migration apart from outer whitespace (read-only verification, 2026-11-02).
- [x] Verify production recommendations and failure associations after application — 2026-11-02: all 3,553 targeted assessments match the checked source values, all 1,262 failure links match the exact intended engine IDs, and all six affected Touareg 3.0 V6 TDI variants are recommended. No differences. Evidence: `data-raw/carinfo/engine-audit/production-check-20261102.json`. No database writes performed during verification.
- [ ] Add sourced assessments for the four omitted engine names.
  - 2026-11-02: primary-source identity research and bilingual factual drafts retained in `docs/MISSING-ENGINE-ASSESSMENTS.md`. Public snapshot confirms five empty rows. Superb/Qashqai petrol-versus-mild-hybrid classification and the requirement for a numeric score/verdict prevent treating these factual drafts as checked reliability assessments. Owner questions are in `docs/QUESTIONS-FOR-MATIJA.md`.
