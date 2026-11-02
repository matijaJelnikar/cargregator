# Tasks

## 1. Schema and types

- [x] 1.1 `src/lib/carinfo.ts`: `ShortText` (sl/en, 1–32 chars), optional `short` on pros/cons items, `hasShorts(answer)`; unit tests
- [x] 1.2 `src/lib/carinfoDb.ts`: `Bilingual` items allow `short?: Bilingual`; `allShort(items)` helper; unit test

## 2. Model page UI

- [x] 2.1 Read `node_modules/next/dist/docs/` on client components before editing
- [x] 2.2 `ModelHero.tsx`: chips view (green pros row, amber cons row), one `aria-expanded` toggle, reset on generation change, fallback to current cards when any label is missing
- [x] 2.3 `sl.json` / `en.json`: `showMore` / `showLess` strings
- [x] 2.4 Check collapsed/expanded/fallback at 360px and desktop, light and dark — 2026-11-02: `scripts/model-qa.ts` passes at 360/1280 in both themes, including toggle state, generation-switch reset, and Passat B9's real missing-label fallback. Screenshots and results: `data-raw/screens/model-states/`.

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
- [x] 4.3 Run `shorten.ts` over all answers in-session — verified 2026-11-02: all 818 answer files already contain labels; resumable run reports `0 shortened, 0 failed, 0 not processed`.
- [ ] 4.4 (Matija) Apply `shorts-*.sql` — **Supabase write**, waits for Matija's OK
  - 2026-11-02: all original batches are archived in `sql/done/`; 795 of 796 published generations have complete labels. Passat B9's guard failed because `spaceNumbers` rewrote `evo2` to `evo 2`. Cleaner fixed with regressions. Apply only the new `data-raw/carinfo/sql/repair-passat-b9-short-labels-20261102.sql` after approval. The patch restores all ten labels and is idempotent in isolated UTF-8 PostgreSQL; it has not been executed remotely.
- [x] 4.5 Verify on production model pages that short labels appear and the toggle works — 2026-11-02: focused read-only production checks passed at 360/1280 in light/dark, including expand/collapse, generation-switch reset and Passat B9's missing-label fallback. Evidence: `data-raw/screens/production-pros-cons/results.json`. Earlier broader production checks encountered intermittent navigation timeouts/503; the focused run passed.

## 5. Ship

- [x] 5.1 Typecheck, lint, tests; commit — 2026-11-02: 218 tests pass, TypeScript and lint clean, production build passed. Local commits are on `codex/openspec-autonomous-20261102`; deployment remains a separate approval step.
- [ ] 5.2 Deploy with the ship-car-guide routine
