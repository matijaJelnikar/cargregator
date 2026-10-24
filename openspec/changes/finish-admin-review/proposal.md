# Proposal

## Why

The review site at `/admin` is built: queue, side-by-side review, and the error-report inbox. Nobody can use it yet,
because Supabase has no user or admin. Real login, edits and permissions are also untested. Hand review of the most-
registered cars is how AI-written reports become trustworthy.

## What Changes

- Admin account setup: a Supabase Auth user, a `carinfo.admins` row and the allowed redirect URLs.
- End-to-end checks:
  - magic-link login;
  - each edit action;
  - status changes;
  - a non-admin account is refused;
  - RLS checked with `set local role`.
- Admin edits show on public pages without waiting up to an hour for the fetch cache.
- Hand review of the ~100 most-registered generations, plus the error-report inbox.

Out of scope: multiple admin roles, audit history, and editing engines' technical data (kW, years) or recalls.

## Capabilities

### New Capabilities
- `admin-review`: signing in to the review site and reviewing, editing, approving or withdrawing car reports and
  public error reports.

### Modified Capabilities

## Impact

- Code already written and uncommitted: `src/app/admin/`, `src/lib/adminAuth.ts`, `src/lib/adminData.ts`,
  `src/app/admin/actions.ts`.
- Public data fetching (`src/lib/carinfoDb.ts`) gets cache tags for on-demand revalidation.
- Supabase Auth settings (redirect URLs, maybe SMTP), and the `carinfo.admins` data. These need Matija.
