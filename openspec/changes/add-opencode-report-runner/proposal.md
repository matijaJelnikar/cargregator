# Proposal

## Why

The report pipeline runs only through `claude -p` on the Claude subscription. That covers about 60 generations
per window, and about 660 of the 818 are still to do. OpenCode Go ($10/month, open models such as Kimi, GLM, Qwen
and DeepSeek) has its own usage windows. Running the long tail there frees the Claude subscription for the
most-registered generations and for the check pass.

## What Changes

- The report and check scripts get a runner choice: `--runner claude` (the default, as today) or
  `--runner opencode` with `--model opencode-go/<id>`. Only `kimi-k2.7-code` and `minimax-m3` are allowed. Go's
  budget is shared and small, so any other model is refused.
- The OpenCode runner calls `opencode run --format json` with a dedicated agent that may only search and fetch
  web pages: no shell, no file edits.
- OpenCode has no JSON-schema flag, so its answer is pulled out of the reply and validated against the same
  `ReportAnswer` schema. One repair round follows if validation fails.
- Each answer records the runner and model that wrote it, and that ends up in `generated_by`.
- A comparison mode writes to a separate folder. A test model's answers never overwrite the Sonnet ones.
- A one-off benchmark runs the two allowed Go models on 5 pilot generations against the Sonnet answers, before one is
  picked for the long tail.

Out of scope: changing the report schema or the prompt content, and using OpenCode for the skeleton data
(already done).

## Capabilities

### New Capabilities
- `report-runner`: how reports and checks are produced by an AI CLI. Covers runner selection, tool limits,
  validation, resuming after usage limits, and provenance.

### Modified Capabilities

## Impact

- `scripts/carinfo/run-claude.ts` (`ask`), `report.ts`, `verify.ts`.
- New: an OpenCode wrapper and an agent/config file with web-only permissions.
- Needs on this machine: the `opencode` CLI, an OpenCode Go subscription connected with `/connect`, and Exa web
  search enabled.
- No database or UI changes. `generated_by` values get a runner prefix.
