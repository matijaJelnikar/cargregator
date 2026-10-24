# Design

## Context

Built (2026-10-23):
- `/admin` with its own root layout (noindex);
- PKCE magic link over plain fetch, with tokens in httpOnly cookies on path `/admin`;
- `requireAdmin` (checks `carinfo.is_admin()` with the user's JWT, and redirects to a refresh route when the token
  has expired);
- server actions that call `actionToken()` and PATCH through PostgREST as the user.

RLS policies for admin writes exist from the first migration. Public pages fetch with `revalidate: 3600`.

## Goals / Non-Goals

**Goals:**
- A working, tested login for Matija.
- Admin changes visible publicly within a minute.

**Non-Goals:**
- Roles, an audit log, or editing technical engine data or recalls.

## Decisions

- **Account:** create the user in the dashboard (Authentication → Users), then insert it into `carinfo.admins` with
  SQL that Matija runs. Sign-ups stay off (`create_user: false`).
- **Redirect URLs:** allow `http://localhost:3000/admin/auth/callback/` and the production
  `/admin/auth/callback/`.
- **Email:** the built-in mailer is limited to a few emails per hour, which is fine for one admin. Add custom SMTP
  only if links stop arriving.
- **Revalidation:**
  - Public fetches in `carinfoDb.ts` get `next: { tags: ["carinfo", "carinfo:<model_id>"] }`.
  - Admin actions call `revalidateTag("carinfo:<model_id>")`, so the action needs the generation's model_id. Read
    it once with the gid.
  - Check `revalidateTag`'s signature in the Next 16 docs before writing the code, and check it on OpenNext/Workers
    (that needs a tag cache, otherwise fall back to a short revalidate).
- **RLS test:** an MCP read-only transaction:
  1. `set local role authenticated`;
  2. `set local request.jwt.claims` to a non-admin uid;
  3. `update` a generation and expect 0 rows.

## Risks / Trade-offs

- **Opening the link in another browser** fails (the verifier cookie is missing). The error says so.
- **Tag revalidation on OpenNext:** `open-next.config.ts` uses the defaults (a dummy incremental cache and tag cache),
  so production does not cache fetches at all. Edits show at once, but every page view queries Supabase. Adding a
  Workers cache later (R2 incremental cache plus a D1 or DO tag cache) keeps the tags working. Without the tag
  cache, tags are ignored.
- **One admin, no audit trail:** acceptable for now.
