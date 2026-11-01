# Tasks

## 1. Schema and types

- [x] 1.1 `src/lib/carinfo.ts`: `ShortText` (sl/en, 1–32 chars), optional `short` on pros/cons items, `hasShorts(answer)`; unit tests
- [x] 1.2 `src/lib/carinfoDb.ts`: `Bilingual` items allow `short?: Bilingual`; `allShort(items)` helper; unit test

## 2. Model page UI

- [x] 2.1 Read `node_modules/next/dist/docs/` on client components before editing
- [x] 2.2 `ModelHero.tsx`: chips view (green pros row, amber cons row), one `aria-expanded` toggle, reset on generation change, fallback to current cards when any label is missing
- [x] 2.3 `sl.json` / `en.json`: `showMore` / `showLess` strings
- [ ] 2.4 Check collapsed/expanded/fallback at 360px and desktop, light and dark

## 3. Shorten step

- [x] 3.1 `scripts/carinfo/shorten.ts`: find answers with items missing `short` (or all with `--all`), batch ~20, ask via `llm.ts` (`--runner`, `--model`; default set in 4.2), validate, write labels into `answers/<id>.json`; resumable
- [x] 3.2 Batch failure handling: retry once, then split; usage-limit errors stop the run cleanly
- [x] 3.3 For exported answers, write guarded `update carinfo.generations` statements to `data-raw/carinfo/sql/shorts-<stamp>-NNN.sql`
- [x] 3.4 Unit tests: batching, validation (count mismatch, over-long label), SQL output
- [x] 3.5 `import.ts`: refuse reports without labels and list them in import-report.md as "needs shorten"; test
- [x] 3.6 `progress.ts` / docs/CARINFO-PROGRESS.md and the pipeline docs: add the shorten step after verify

## 4. Backfill

- [x] 4.1 Bake-off: run `shorten.ts` (to a scratch output, not answers/) on the same 20 reports (10 most registered, 5 with technical cons, 5 Go-written) with Sonnet, `opencode-go/minimax-m3` and `opencode-go/claude-haiku-5-5`; write a side-by-side sl/en table
- [x] 4.2 (Matija) Pick the model from the table; set it as the default in `shorten.ts`
- [ ] 4.3 Run `shorten.ts` over all answers in-session
- [ ] 4.4 (Matija) Apply `shorts-*.sql` — **Supabase write**, waits for Matija's OK
- [ ] 4.5 Verify on production model pages that chips appear and the toggle works

## 5. Ship

- [ ] 5.1 Typecheck, lint, tests; commit
- [ ] 5.2 Deploy with the ship-car-guide routine
