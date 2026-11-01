## Why

The pros/cons cards on the model page are a wall of full sentences (4 + 4 items of 10–15 words each), so the
first thing under the summary is hard to scan. Readers should see the gist at a glance and open the full text only
when they want it.

## What Changes

- Each pros/cons item gains a short label, `short: {sl, en}`, 2–4 words and at most 32 characters per language
  ("Precise handling", "N16 timing chain"). The full sentence stays as it is.
- The model page shows the labels as compact chips (green pros, amber cons). One "Show more" toggle under the block
  switches all items to the current full-sentence lists. Collapsed is the default.
- A generation whose items have no labels yet shows the current full lists, never a mix.
- A new pipeline step, `scripts/carinfo/shorten.ts`, writes the labels from the final (verified) sentences with a
  cheap model and no tools. It runs after `verify`; `import` refuses reports without labels.
- Backfill for the 818 already written reports: shorten them all and write SQL update files for the exported ones.
  Matija applies the SQL.

Out of scope:
- Rewriting or regenerating the pros/cons sentences themselves, or changing how many items a report has.
- Editing labels in `/admin` (admins don't edit pros/cons today).
- Any change to the summary, engine verdicts or known failures.
- A schema migration: `pros`/`cons` are already jsonb.

## Capabilities

### New Capabilities
- `report-display`: how the model page presents a report's pros and cons (short labels, expand toggle, fallback).

### Modified Capabilities

## Impact

- `src/lib/carinfo.ts` (zod: optional `short` on items, a stricter check for import), `src/lib/carinfoDb.ts` (type).
- `src/components/ModelHero.tsx`, dictionaries `sl.json` / `en.json` (toggle labels).
- `scripts/carinfo/shorten.ts` (new), `scripts/carinfo/import.ts` (require labels), `progress.ts` if it counts steps.
- Data: `data-raw/carinfo/reports/answers/*.json` gain labels; new SQL files in `data-raw/carinfo/sql/`.
- Supabase `carinfo.generations.pros/cons` content (via SQL Matija applies). No migration.
