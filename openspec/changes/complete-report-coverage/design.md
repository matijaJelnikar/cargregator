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

- **No cut-off (Matija, 2026-10-24).** Sonnet writes from the top (`--all`), the Go model from the bottom
  (`--all --tail`), in parallel, until they meet. Answers are per generation, so they never collide.
- **Go model: `minimax-m3`**, judged by its check results, not a benchmark. If its share of held-back reports or of
  unsupported failures is more than twice Sonnet's, stop Go writing and try `kimi-k2.7-code` on 10 tail generations.
- **Result (2026-10-25):** both Go models failed. MiniMax (48 reports): 8% held back, 12% of failures unsupported,
  vs Sonnet's 2% and 4%. Kimi (6 of 10 trial reports): 17% held back, 35% unsupported, at ~$0.80 of Go usage per
  report (MiniMax ~$0.22). Unless Matija decides otherwise, the tail is written on Sonnet as Claude windows allow.
- **Checks before writing.** Every report is checked on Claude, whoever wrote it. When a Claude window is available,
  clear unchecked reports before writing new Sonnet ones.
- **Confidence from the check, not the model.** MiniMax rates itself 0.7–0.8, Claude 0.4–0.6. `import.ts` writes
  `ai_confidence` from the check results (share of supported failures, number of sources) for every runner.
- **Held back:** one retry on Sonnet (with the preferred-sources prompt); if still weak, the generation has no
  report and shows specs and recalls only.
- **Batch routine per window:**
  1. Run `report.ts` until it hits the limit.
  2. Run `verify.ts`.
  3. Run `import.ts`.
  4. Matija loads the new `reports-*.sql`, or OKs an MCP load.
  5. Clear `.next/dev/cache/fetch-cache` and spot-check 2 pages.
- **SQL files** hold about 20 generations each (~300 KB) so they paste into the SQL editor. `import.ts` remembers
  what it exported (`reports/exported.json`, keyed by check time) and writes only new or re-checked reports, as a
  timestamped batch, so earlier batches are never overwritten.
- **Engine-level reports:** dropped from this plan (Matija, 2026-10-24); revisit after launch.

## Risks / Trade-offs

- **Subscription windows:** about 60 generations per Claude window. With Go in parallel, about 10–12 windows.
- **Different models write in different styles.** The check pass stays on Claude for consistency. The admin queue
  can filter by low confidence.
- **Loading volume through the MCP** (about 11 MB in all). It is slow but works; pasting into the SQL editor is the
  fallback.
