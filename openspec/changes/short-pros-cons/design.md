## Context

`ModelHero.tsx` renders `gen.pros` / `gen.cons` (jsonb `[{sl, en}]` in `carinfo.generations`) as two bordered cards
with bullet lists. Reports come from the pipeline `report.ts` → `verify.ts` (checks, and rewrites flagged prose in
`answers/<id>.json`, keeping `<id>.orig.json`) → `import.ts` (SQL batches of `carinfo.load_report`, which copies
`r->'pros'` as is). 818 reports are written, 796 exported. Admins don't edit pros/cons.

Constraints: no API key (LLM work runs through `llm.ts` on subscription CLIs and must be resumable); Supabase writes
are SQL files Matija applies; generated data stays in `data-raw/`.

## Goals / Non-Goals

**Goals:** scannable chips by default, full text one click away, labels always matching the final sentences, a
backfill that needs no regeneration of reports.

**Non-Goals:** changing sentences, label editing in admin, a DB migration.

## Decisions

1. **Labels live on the item: `{sl, en, short: {sl, en}}`.** Keeps label and sentence together through every
   reorder and fix. Alternative: parallel `pros_short` columns — needs a migration and can drift out of order.
2. **`short` is optional in `ReportAnswer`, required by import.** `report.ts` and verify's fix pass keep their
   prompts and schema contract; a `ShortText` (1–32 chars) check and a `hasShorts(answer)` helper gate export.
   Alternative: ask `report.ts` for labels directly — longer research prompt, and verify's fix pass would rewrite
   sentences without updating labels.
3. **Staleness is handled by dropping labels.** Verify's fix pass rewrites pros/cons from `ReportFix`, which has no
   `short`, so a fixed item loses its label and `shorten.ts` picks it up again. `shorten.ts` processes any answer
   with an item missing `short`; `--all` redoes everything.
4. **`shorten.ts` batches ~20 reports per call, no tools.** Input: `{id, pros:[{sl,en}], cons:[…]}[]`; output:
   labels by id and index, validated with zod (same count per list, ≤32 chars). A batch that fails validation is
   retried once, then split; resumable because each answer file is written as soon as its batch returns.
   Runner/model through `llm.ts` with `--runner` / `--model`. The default is the winner of a bake-off on 20 reports
   (10 most registered, 5 with technical cons such as engine/part codes, 5 written by Go models) between Sonnet
   (`claude -p`), `opencode-go/minimax-m3` and `opencode-go/claude-haiku-5-5`, judged by Matija on label quality,
   Slovenian first; the job is ~41 calls, so cost doesn't decide. The other runner stays the fallback for when a
   subscription window runs out. **Result (2026-10-31): Sonnet.** Sonnet and Go Haiku both labelled 20/20, Sonnet
   slightly more precise; MiniMax M3 failed 12/20 (Slovenian over 32 chars). Haiku is the fallback. The prompt asks for 2–4 words, noun phrase, the specific point not a category ("N16 timing chain",
   not "Engine issues"), Slovenian label written natively, not translated word-for-word.
5. **Backfill SQL is a plain update, not `load_report`.** For answers already in `exported.json`, `shorten.ts`
   writes `data-raw/carinfo/sql/shorts-<stamp>-NNN.sql`:
   `update carinfo.generations set pros = …::jsonb, cons = …::jsonb where id = …;` — reloading whole reports would
   needlessly replace failures, checks and links. Not-yet-exported reports get labels through the normal `import`.
   The update matches only when the stored sentences equal the answer's (`and pros->0->>'en' = …`) so an admin or
   later load is never overwritten with stale data.
6. **UI: one client-side toggle in `ModelHero`.** `useState(false)` reset on generation change. Collapsed: two rows
   of `Chip`-styled spans (non-interactive), thumbs icon leading each row. Expanded: the existing `ProsCons` cards.
   Fallback when `!allShort(gen, lang)`: existing cards, no toggle. Toggle is a `<button aria-expanded>`; strings
   `showMore` / `showLess` in the dictionaries.

## Risks / Trade-offs

- [Labels oversimplify a nuanced con] → the full sentence is one click away; prompt asks for the specific point.
- [Slovenian labels read like machine translation] → prompt writes sl natively; spot-check 20 before the backfill SQL.
- [The chosen model fails validation often] → retry/split; `--runner`/`--model` to switch.
- [Chips with long sl labels wrap awkwardly on phones] → 32-char cap; check at 360px.

## Migration Plan

1. Ship code (schema optional field, UI with fallback) — pages unchanged until data arrives.
2. Run `shorten.ts` over all answers; spot-check; Matija applies `shorts-*.sql`.
3. Rollback: the UI falls back on missing labels, so reverting data or code alone is safe.

## Open Questions

None.

## Display update — 2026-11-01
Matija prefers plain two-column lists to badges. Collapsed and expanded states now share the list layout, with green checks and red minus signs. The buying-guide reframe is tracked in ../reframe-car-guide/.
