# Tasks

## 1. Pilot load

- [x] 1.1 (Matija) `node scripts/carinfo/import.ts` and read `data-raw/carinfo/reports/import-report.md`
- [x] 1.2 (Matija) Load `data-raw/carinfo/sql/reports-*.sql` in the SQL editor, or OK an MCP load
  (**Supabase write**)
- [x] 1.3 Check row counts per status via MCP (read only); clear `.next/dev/cache/fetch-cache`; spot-check Golf,
  Octavia and Duster pages

## 2. Import tooling

- [x] 2.1 `import.ts`: coverage summary (written / checked / exported / held back / total) at the top of
  import-report.md; unchecked answers listed as "not checked"
- [x] 2.2 `import.ts`: only reports checked since the last export (`reports/exported.json`; `--all` for every one),
  written as a timestamped batch `reports-<stamp>-NNN.sql` of ~300 KB (~20 generations) per file
- [x] 2.3 Tests for the coverage counts and for skipping unchecked answers

## 3. Full run (repeat per subscription window)

- [ ] 3.1 Sonnet: `report.ts --all` for the top N generations by registrations (N from add-opencode-report-runner
  4.3)
- [ ] 3.2 OpenCode Go: `report.ts --all --runner opencode --model <chosen>` for the rest
- [ ] 3.3 Retry the failures listed in `reports/errors/` (smart-fortwo/c453 and any others)
- [ ] 3.4 `verify.ts` on all unchecked answers; retry `FAILED` ones
- [ ] 3.5 `import.ts` (new reports only); (Matija) load the batch (**Supabase write**)
- [ ] 3.6 Repeat 3.1–3.5 until all 818 generations are imported or listed as held back

## 4. Wrap-up

- [ ] 4.1 Re-run held-back generations once with Opus, or accept them as having no report
- [ ] 4.2 Propose a separate change for engine-level reports (top ~100 engine combinations)
