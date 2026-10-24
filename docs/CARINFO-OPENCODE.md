# Car reports on OpenCode Go

How to run the long tail of car reports on the OpenCode Go plan. Claude Code keeps the most-registered generations
on Sonnet. OpenCode works from the least-registered end (`--tail`), so the two runs meet in the middle and never write
the same generation.

Where things stand: `docs/CARINFO-PROGRESS.md` (regenerate it with `node scripts/carinfo/progress.ts`).

## Option A: plain terminal (recommended, spends nothing on an agent)

```bash
cd ~/developement/cargregator
node scripts/carinfo/report.ts --all --tail --runner opencode --model opencode-go/<MODEL> --jobs 2
node scripts/carinfo/progress.ts
```

`<MODEL>` is `minimax-m3` or `kimi-k2.7-code`, whichever won the benchmark (`data-raw/carinfo/reports/bench.md`).
When it prints "Stopping: subscription limit reached", run the same command again after the Go window resets.

## Option B: inside OpenCode

Pick `opencode-go/minimax-m3` as the chat model (cheapest; this agent only runs commands), then paste:

```
You are only running an existing pipeline. Do not write or change code, do not read large files, do not commit.

Read docs/CARINFO-PROGRESS.md (summary and "Next up" only) and openspec/config.yaml.

Rules:
- Allowed report models: opencode-go/minimax-m3 and opencode-go/kimi-k2.7-code only. Use <MODEL>.
- Never write to Supabase. Never touch data-raw/carinfo/reports/answers by hand.
- Always use --tail (Claude Code works the other end of the list at the same time).

Do this:
1. Run: node scripts/carinfo/report.ts --all --tail --runner opencode --model opencode-go/<MODEL> --jobs 2
   Let it run until it finishes or prints "Stopping: subscription limit reached".
2. Run: node scripts/carinfo/progress.ts
3. Reply with the last 5 lines of step 1's output and the summary table from docs/CARINFO-PROGRESS.md.
   Nothing else.
```

The check pass (`verify.ts`) and the SQL export (`import.ts`) stay with Claude Code, so a different model checks
what Go wrote.
