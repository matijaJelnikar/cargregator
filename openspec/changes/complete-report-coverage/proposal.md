# Proposal

## Why

Reports exist for 159 of 818 generations, 79 are checked, and only Golf VII is in Supabase. Until the rest are
written, checked and loaded, the car guide shows a report for one car.

## What Changes

- Load the 79 checked pilot reports (Matija runs the SQL, or OKs an MCP load).
- Finish the full run, in order of registrations, across Claude and OpenCode Go windows:
  - most-registered generations on Sonnet;
  - the long tail on the Go model chosen in add-opencode-report-runner.
- Check every new answer with `verify.ts`. Retry failed ones.
- Import and load in batches, so pages fill up as runs finish rather than at the end.
- Engine-level reports for the ~100 most-registered engine combinations, once generation coverage is done.
- A coverage line in the import report: written, checked, imported, held back.

Out of scope: hand review (finish-admin-review) and changes to what the report shows (set-report-content-policy).

## Capabilities

### New Capabilities
- `report-publishing`: which reports become public and when. Covers the check gate, holding back weak reports,
  batch loading, and protecting reviewed content from re-imports.

### Modified Capabilities

## Impact

- Data: `carinfo.generations`, `engines`, `failures`, `checks`, `links` through `carinfo.load_report`. About 800
  calls of ~14 KB each; each batch needs Matija's OK.
- `scripts/carinfo/import.ts`: the coverage summary, plus a batch size option for SQL files.
- Subscription usage on both Claude and OpenCode Go.
