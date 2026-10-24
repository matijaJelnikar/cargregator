# Tasks

## 1. OpenCode setup

- [ ] 1.1 (Matija) Install the `opencode` CLI, subscribe to OpenCode Go, run `/connect` → OpenCode Go, and set
  workspace privacy so no model trains on requests
- [x] 1.2 Run one `opencode run --format json -m opencode-go/<model>` call by hand. Save a sample of its events
  (the success event, the error event, a usage-limit message if one can be triggered) in
  `scripts/carinfo/fixtures/`
- [ ] 1.3 Confirm `websearch` (with `OPENCODE_ENABLE_EXA=true`) and `webfetch` work headless, and that a shell or
  edit request is denied by the agent config. Status: webfetch works and shell is unavailable (fixtures), but the
  only websearch sample is "Web search cancelled", so it needs one more real call once the Go limit resets

## 2. Runner wrapper

- [x] 2.1 Add `scripts/carinfo/opencode.json` (agent `carinfo-report`: webfetch and websearch allowed, everything
  else denied)
- [x] 2.2 Add `scripts/carinfo/llm.ts` with `ask({ runner, model, prompt, schema, tools, system, cwd, timeoutMs })`.
  Move the Claude code into `askClaude` and add `askOpencode` (spawn, parse events, extract JSON, one repair round)
- [x] 2.3 Unit tests for JSON extraction and event parsing, using the fixtures from 1.2
- [x] 2.4 Tighten usage-limit detection with the real Go message; test it
- [x] 2.5 Tool errors (a page answering 429) no longer count as usage limits; only provider error events do
- [x] 2.6 Answers save `cost_usd` and `seconds`, which the benchmark table reads
- [x] 2.7 Allow only `opencode-go/kimi-k2.7-code` and `opencode-go/minimax-m3` (`OPENCODE_MODELS`); refuse others
  before any call

## 3. Scripts

- [x] 3.1 `report.ts` and `verify.ts`: add `--runner` (default `claude`) and `--out <dir>`, and save `runner` in
  each answer
- [x] 3.2 `import.ts`: `generated_by = runner/model`; old answers without `runner` count as `claude`
- [x] 3.3 Update the usage comments at the top of each script

## 4. Benchmark and choice

- [ ] 4.1 Run the two allowed Go models on the 5 benchmark generations into `reports/bench/<model>/`, then run `verify.ts` on
  them
- [ ] 4.2 Add `scripts/carinfo/bench.ts` and write the comparison table to `data-raw/carinfo/reports/bench.md`
- [ ] 4.3 (Matija) Pick the Go model and the cut-off: which registration rank and below goes to Go, and what
  stays on Sonnet
- [ ] 4.4 Write the choice into `docs/CARINFO-QUESTIONS.md` (questions 7 and 7a) and into complete-report-coverage's
  design
