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
- [x] 2.4 `progress.ts` → `docs/CARINFO-PROGRESS.md` (committed log of every generation's state, next up, by runner)
- [x] 2.5 `report.ts --tail` (least registered first) and a per-generation re-check, so Claude and OpenCode can run
  at the same time from opposite ends

## 3. Full run (repeat per subscription window)

- [x] 3.0 Clear the unchecked backlog with `verify.ts`; compare MiniMax with Sonnet (held-back and unsupported
  rates, see design "Go model") — reconciled 2026-11-02: no unchecked reports remain; the 2026-10-25 comparison and rejection of both Go candidates are recorded in design.md.
- [x] 3.0a `import.ts`: derive `confidence` from the check results instead of the model's own number; test it
- [x] 3.1 Sonnet: `report.ts --all` from the top, until it meets the Go run — all 818 generations have answers; 727 were written by Claude/Sonnet. Confirmed by refreshed progress log, 2026-11-02.
- [x] 3.2 ~~OpenCode Go tail run~~ — completed/replaced under design.md's 2026-10-25 decision: both Go candidates failed the quality threshold; Sonnet finished the remaining reports. No further Go writing run is needed.
- [x] 3.3 Retry the failures listed in `reports/errors/` (smart-fortwo/c453 and any others) — refreshed progress has zero failed generations and zero not started, 2026-11-02.
- [x] 3.4 `verify.ts` on all unchecked answers; retry `FAILED` ones — refreshed progress has zero written-but-unchecked generations, 2026-11-02.
- [x] 3.5 `import.ts` (new reports only); (Matija) load the batch (**Supabase write**) — read-only public snapshot, 2026-11-02: the exact 796 exported generation IDs are public with `ai_checked` status. This does not close the separate child-row repairs in `fix-report-engine-matching`.
- [x] 3.6 Repeat 3.1–3.5 until all 818 generations are imported or listed as held back — 796 published and 22 held back; exported IDs match public AI-checked IDs exactly, 2026-11-02.

## 4. Wrap-up

- [ ] 4.1 Re-run held-back generations once with Sonnet (preferred-sources prompt); accept the rest as having no report
- [x] ~~4.2~~ (dropped) Engine-level reports: revisit after launch
