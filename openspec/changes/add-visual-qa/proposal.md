# Proposal

## Why

None of the car-guide or admin pages have been looked at in a browser by the agent. Playwright's Chromium is
installed but cannot start (missing system libraries). Layout bugs at phone width would go unnoticed until users
find them.

## What Changes

- Install the system libraries Chromium needs (Matija runs one apt command).
- Add a screenshot script: it takes the key pages at 390 px and 1280 px, in light and dark mode, and saves them to
  `data-raw/screens/` for review.
- Do one review pass over the screenshots and fix what's found.

Out of scope: automated visual regression in CI.

## Capabilities

### New Capabilities

### Modified Capabilities

## Impact

- Tooling only: `scripts/screens.ts` and a dev dependency on Playwright if one isn't there already.
- No behaviour changes, so `skip_specs: true`.
