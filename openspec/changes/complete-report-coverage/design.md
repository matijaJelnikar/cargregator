# Design

## Context

The pipeline is `report.ts --all` → `verify.ts` → `import.ts` → `data-raw/carinfo/sql/reports-NNN.sql`, with one
`select carinfo.load_report(id, json, by)` per generation. The rules above are mostly in place already:
- `load_report` skips rows with status reviewed;
- `import.ts` drops unsupported failures and holds back weak reports.

What's missing is the coverage summary, splitting the work across runners, and a repeatable batch routine.

## Goals / Non-Goals

**Goals:**
- All 818 generations written, checked and loaded.
- A routine either agent can repeat each subscription window without re-deriving state.

**Non-Goals:**
- Hand review (finish-admin-review).
- Changing report content rules (set-report-content-policy).

## Decisions

- **Split by registrations.** The top N generations (N decided in add-opencode-report-runner task 4.3, suggested
  ~150) stay on Sonnet; the rest go to the chosen Go model. Both runs can go in parallel from two terminals because
  answers are per generation.
- **Batch routine per window:**
  1. Run `report.ts` until it hits the limit.
  2. Run `verify.ts`.
  3. Run `import.ts`.
  4. Matija loads the new `reports-*.sql`, or OKs an MCP load.
  5. Clear `.next/dev/cache/fetch-cache` and spot-check 2 pages.
- **SQL files** hold about 20 generations each (~280 KB) so they paste into the SQL editor. `import.ts` gets
  `--since <date>` so only new batches are written.
- **Engine-level reports** come after generation coverage: the top ~100 engine combinations by registrations, with
  a separate prompt that focuses on that engine. This needs a small `ReportAnswer` variant and a loader. Plan it in
  its own change when generation coverage is near done.

## Risks / Trade-offs

- **Subscription windows:** about 60 generations per Claude window. With Go in parallel, about 10–12 windows.
- **Different models write in different styles.** The check pass stays on Claude for consistency. The admin queue
  can filter by low confidence.
- **Loading volume through the MCP** (about 11 MB in all). It is slow but works; pasting into the SQL editor is the
  fallback.
