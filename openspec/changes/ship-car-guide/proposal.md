# Proposal

## Why

The car guide is on branch `feat/car-guide` and is not pushed. The admin site, the script fixes and these specs are
not committed. Nothing reaches users until it is merged and deployed to Cloudflare Workers, and the admin site has
never run on Workers.

## What Changes

- Commit the remaining work in logical chunks:
  - the admin site;
  - the report-script fixes;
  - OpenSpec and the docs.
- Push the branch and open a PR to `main`.
- Deploy with OpenNext to Cloudflare Workers, then check the car guide and `/admin` in production: cookies,
  server actions, auth redirects and fetch caching.
- Set the production URL in Supabase Auth's redirect list (see finish-admin-review).

Out of scope: new features. This change is release work only.

## Capabilities

### New Capabilities

### Modified Capabilities

## Impact

- Git: the `feat/car-guide` branch, then a PR to `main`.
- Cloudflare Workers deployment (existing OpenNext setup from PR #1).
- No behaviour changes beyond what other changes specify, so `skip_specs: true`.
