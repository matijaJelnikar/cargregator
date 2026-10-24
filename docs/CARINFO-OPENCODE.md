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

**Model (2026-10-24):** MiniMax failed the check (14% of its reports held back vs 2% for Sonnet, 16% of failures
unsupported vs 4%), so it no longer writes reports. Kimi is on trial: first these 10 tail generations, then Claude
Code checks them and decides whether Kimi takes over `--all --tail`.

```bash
OPENCODE_ENABLE_EXA=true node scripts/carinfo/report.ts --runner opencode --model opencode-go/kimi-k2.7-code --jobs 2 \
  jeep-grand-cherokee/wh alfa-romeo-147/mk1 mercedes-benz-slk/r171 jeep-compass/mk3 audi-e-tron/gh \
  nissan-micra/k12 opel-combo/combo-c ford-c-max/mk1 ford-tourneo-connect/mk1 mitsubishi-lancer/evo-x
```

Only after Kimi passes, `<MODEL>` above is `kimi-k2.7-code`. When it prints "Stopping: subscription limit reached",
run the same command again after the Go window resets.

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
