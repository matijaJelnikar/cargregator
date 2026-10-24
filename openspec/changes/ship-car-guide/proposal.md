# Proposal

## Why

The car guide is merged (PR #4) and live at https://cars.jelnikar.dev, deployed by hand with `npm run deploy`. The
release work this change first described is done. What remains is a repeatable routine for shipping code changes
(the report policy, visual fixes, admin fixes) and checking `/admin` on Workers, which has never been tried.

Report data does not need a deploy: pages read Supabase at runtime, so loading a batch shows up without one.

## What Changes

- A deploy routine: checks → push `main` → `npm run deploy` → probe production.
- First run: the "avoid" hotfix (set-report-content-policy 2.0) and the 14 commits not yet on origin.
- Production checks of `/admin` once the admin account exists (finish-admin-review).

Out of scope: new features, CI deploys.

## Capabilities

### New Capabilities

### Modified Capabilities

## Impact

- Git: `main` and `origin/main`.
- Cloudflare Workers deployment (OpenNext, `npm run deploy`).
- No behaviour changes beyond what other changes specify, so `skip_specs: true`.
