# Engine report import audit — 2026-11-01

## Result
Read-only audit of all 796 exported reports against 818 public generations.
2,493 report assessment names did not match the stored engine names.
Most appended the real engine codes from the prompt; five assessment names needed explicit correction.
Repairs cover 498 generations: 3,553 empty engine assessments and 1,262 missing failure-to-engine links.
No Supabase writes have been performed.

## Cause and prevention
The report prompt displayed engine codes in parentheses next to the canonical name.
The old loader required exact equality, counted attempted assessments rather than changed rows, and silently
converted unmatched engine-specific failure names to null (generation-wide).
The exporter now canonicalises verified code suffixes and case/spacing, with scoped reviewed aliases for exceptional typos.
It rejects unknown/duplicate assessments, unknown failure engines, and missing engine coverage.
The prompt now quotes the exact name separately from metadata.
The new loader migration validates all keys before any write, counts changed rows, refuses hidden generations,
and returns without touching anything for a reviewed generation. This also fixes the old reviewed-generation
guard, which protected its summary but still allowed changes to its children and source links.

## Apply in Supabase
Project policy requires Matija's explicit approval for database writes.
All files below are in data-raw/carinfo/sql/:
1. engine-import-guards-20261101.sql (same contents as supabase/migrations/20261101000000_carinfo_report_import_guards.sql).
   Run this copy OR apply the migration through your normal migration workflow, not both.
2. The 21 engine-repair-20261101-2019-NNN.sql files, 000 through 020, in numeric order.

The repairs fill only entirely empty engine assessments and relink previously unlinked published failures.
They check the existing report summary, row identity/content, and review/visibility state.
They do not reload reports or delete rows. Re-running them is a no-op.
Superseded development files are outside the SQL execution folder in data-raw/carinfo/engine-audit/superseded/.

## Validation
- TypeScript passes; lint has zero errors and five pre-existing warnings.
- 174 unit tests pass, including matching and export regressions.
- All repair SQL and migrations executed successfully in an isolated PostgreSQL 16 database populated from the public snapshot.
- Exactly 3,553 assessments and 1,262 links restored; six Touareg 3.0 V6 TDI variants become recommended.
- A second full SQL pass leaves all rows, including updated_at, unchanged.
- Strict loader tests reject unknown, duplicate and missing assessments and unknown failure-engine references.
- Protection tests preserve reviewed/hidden content and manually edited assessment/source-summary fields.
- Local PostgreSQL validation instances have been stopped.

## Genuine missing content
Five database rows across these four names have no assessment in their source report:
- Skoda Fabia IV: 1.5 TSI.
- Skoda Superb IV: 1.5 TSI.
- Nissan Qashqai J12: 1.3 DIG-T (two power variants).
- Renault Megane IV: 1.0 TCe.
These need sourced assessments, not automatic name matching. No recommendation was invented or copied.

## Repeat the audit
node scripts/carinfo/audit-imports.ts --refresh
Downloads public data and writes a new audit and guarded local SQL. It never writes to Supabase.
Without --refresh it reuses data-raw/carinfo/engine-audit/snapshot.json.
Raw snapshot, audit.json and sql-validation.json are retained under data-raw/carinfo/engine-audit/.
