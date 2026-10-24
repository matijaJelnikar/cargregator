# Spec Delta

## Purpose

Defines how car reports and their check pass are produced by an AI command-line runner (Claude Code or OpenCode Go)
on a subscription, so runs are safe, resumable and traceable whichever model writes them.

## ADDED Requirements

### Requirement: Selectable runner
The report and check scripts SHALL accept a runner (`claude` or `opencode`) and a model. Without a runner they SHALL
behave exactly as before (Claude Code, Sonnet).

#### Scenario: Default run is unchanged
- **WHEN** `report.ts --all` is started without `--runner`
- **THEN** each generation is answered by `claude -p` with the Sonnet model, as before this change

#### Scenario: OpenCode Go run
- **WHEN** `report.ts --runner opencode --model opencode-go/kimi-k3 skoda-fabia` is started
- **THEN** each generation of the Fabia is answered by `opencode run` with that model

### Requirement: Web-only tools
A report call SHALL be able to search and fetch web pages, and SHALL NOT be able to run shell commands, edit files
or use any other tool, whichever runner is used.

#### Scenario: Model tries a shell command
- **WHEN** an OpenCode report call asks to run a shell command or write a file
- **THEN** the call is denied by the agent's permissions and the run continues without it

### Requirement: Same answer contract
Every answer SHALL be validated against the report schema before it is saved. An invalid answer SHALL get one repair
attempt with the validation errors; if it is still invalid it SHALL be recorded as a failure and not saved.

#### Scenario: JSON wrapped in prose
- **WHEN** an OpenCode answer contains the report JSON inside a fenced block with text around it
- **THEN** the JSON is extracted, validated and saved

#### Scenario: Still invalid after repair
- **WHEN** the repaired answer still fails validation
- **THEN** the generation is listed in the errors folder with the reason and no answer file is written

### Requirement: Resumable under usage limits
A run SHALL stop starting new calls once a runner reports a usage limit, and a rerun of the same command SHALL skip
generations that already have an answer.

#### Scenario: Go window runs out
- **WHEN** OpenCode reports that the model's 5-hour usage limit is reached
- **THEN** the run stops, prints how many were answered, failed and left, and a later rerun continues with the rest

### Requirement: Provenance
Every saved answer SHALL record the runner and model that wrote it, and imported reports SHALL carry it as
`generated_by`.

#### Scenario: Imported Go report
- **WHEN** a report written by `opencode-go/glm-5.3` is imported
- **THEN** the generation's `generated_by` is `opencode/opencode-go/glm-5.3`

### Requirement: Comparison runs do not overwrite
A run with an output folder override SHALL write answers only there and SHALL NOT skip, change or delete answers in
the main answers folder.

#### Scenario: Benchmark next to Sonnet answers
- **WHEN** a benchmark run writes Golf VII to the comparison folder
- **THEN** the existing Sonnet answer for Golf VII is unchanged
