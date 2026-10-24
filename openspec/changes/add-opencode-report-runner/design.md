# Design

## Context

`run-claude.ts` exports `ask(prompt, model, schema, {tools, system, cwd, timeoutMs})`. It spawns
`claude -p --output-format json --json-schema … --tools WebSearch,WebFetch` and returns `structured_output`.
`report.ts` and `verify.ts` call it. OpenCode's `opencode run` takes `-m provider/model`, `--format json` (raw JSON
events, schema not documented), `--agent`, `--standalone` (private server instead of the background service) and `--auto` (opencode v2.1.4; there is no `--dir`). It has no JSON-schema option. Its `webfetch` tool is
built in. `websearch` needs `OPENCODE_ENABLE_EXA=true`. Go limits are per model: a 5-hour window is 20% of the
monthly allowance, a weekly window 50%.

## Goals / Non-Goals

**Goals:**
- One `ask()` signature for both runners, so `report.ts` and `verify.ts` only pass `runner` through.
- Same validation and resume behaviour as today.
- Pick a Go model on evidence, not on guesswork.

**Non-Goals:**
- Parallel runs across both subscriptions in one process. Two terminals do that.
- Moving the check pass off Claude. It may use OpenCode later, but the default stays Claude so a different model
  checks the writer.

## Decisions

- **Wrapper:** `scripts/carinfo/llm.ts` exports `ask({ runner, model, … })`. `run-claude.ts` keeps its
  Claude-specific code as `askClaude`, and a new `askOpencode` sits beside it.
- **OpenCode isolation:**
  - Config: `scripts/carinfo/opencode.json` defines agent `carinfo-report` with permissions `webfetch: allow`,
    `websearch: allow` and everything else `deny`. It is passed through `OPENCODE_CONFIG` and `--agent`.
  - Calls run with `--standalone` and with the child process cwd set to `data-raw/carinfo/reports`, so the report agent never works inside the repo. The binary is `$OPENCODE_BIN`, falling back to `~/.opencode/bin/opencode` (it is not on the non-interactive PATH).
  - Calls run with `--auto`, which still honours explicit denies.
- **Structured output:** the schema is appended to the prompt as "answer with one JSON object matching this
  schema". The wrapper takes the final assistant text from the JSON events, extracts the last fenced or bare JSON
  object and validates it with zod. On failure it sends one repair prompt (the same session via `--session`) that
  lists the zod errors.
- **Limit detection:** a regex over the error event and stderr (`limit|quota|rate|429|insufficient`) is treated as
  "stop the run", as for Claude. The exact Go message is captured in task 1.2 and the regex tightened.
- **Provenance:** answer JSON gets `runner` beside `model`. `import.ts` writes `generated_by = runner/model`.
- **Benchmark:** `report.ts --out reports/bench/<model> …` plus a `scripts/carinfo/bench.ts` that prints a table
  per generation: failures found, sources, verify results (supported/weak/unsupported), verdicts that differ from
  Sonnet, confidence, time and the cost estimate.
  - Generations: Golf VII, Octavia III, Clio IV, Qashqai J11, Sandero III.
  - Models: only the allowed ones, `kimi-k2.7-code` and `minimax-m3`.
  - Exclude models that train on request data (the Gemini and Muse "Contributor" models).

- **Allowed models (Matija, 2026-10-24):** only `opencode-go/kimi-k2.7-code` and `opencode-go/minimax-m3`. Go has one
  shared budget, not one per model: a single coding session plus a few Kimi K3 calls used a full 5-hour window and
  20% of the month. The list is `OPENCODE_MODELS` in `llm.ts`. The runner and the scripts refuse any other model.
- **No coding on Go:** building and fixing the scripts is done in Claude Code. The Go budget is kept for writing
  reports.

## Risks / Trade-offs

- **Weaker research:** open models may follow fewer sources or mix generations. Mitigations: the check pass stays on
  Claude, and the benchmark gates the switch.
- **Undocumented event format:** `--format json` events can change between versions. Pin the OpenCode version in
  the README and keep the parser tolerant (take the last text part).
- **Search backend:** Exa search may have its own limits or keys. Task 1.3 confirms it works headless before
  any long run.
- **Region and privacy settings:** DeepSeek needs the Global region enabled. Workspace privacy must not allow
  training on prompts.
