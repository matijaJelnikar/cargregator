# Car guide: what is still to do

Status on 2026-10-24. Open content/product questions are in `docs/CARINFO-QUESTIONS.md`; this file is the
task list. **The working plan is now OpenSpec:** `openspec/changes/*` (one change per area below, with spec,
design and tasks); run `npx @fission-ai/openspec list` for progress. This file stays as the short overview. Report run progress: `docs/CARINFO-PROGRESS.md`; OpenCode instructions:
`docs/CARINFO-OPENCODE.md`. **You** = needs Matija, **Claude** = can run on its own.

## Where things stand

| Part | State |
|---|---|
| Supabase data | 421 models, 818 generations, 6893 engines, 5614 recalls loaded |
| Car profile pages (`/avti/…`) | built and committed (5215732), live data except photos |
| Reports, pilot (25 models, 79 generations) | written and checked; only Golf VII is in Supabase |
| Reports, full run (`report.ts --all`) | 159 of ~818 written, 79 checked; stopped at the subscription limit |
| Admin site (`/admin`) | built, tests pass, **not committed**, no admin account yet |
| Photos | fetched locally; waiting for R2 |

## 1. Load the pilot reports (you)

1. `! node scripts/carinfo/import.ts`. It only writes local files:
   `data-raw/carinfo/sql/reports-*.sql` and `data-raw/carinfo/reports/import-report.md`.
2. Read `import-report.md` for any generation that was held back for weak sources.
3. Run the `reports-*.sql` files in the Supabase SQL editor, or tell Claude to load them through the MCP.
4. Check `/sl/avti/` pages, for example Golf, Octavia and Duster.

## 2. Admin site setup (you)

1. In Supabase, under Authentication → Users, add a user with your email.
2. In Authentication → URL Configuration, add both redirect URLs:
   - `http://localhost:3000/admin/auth/callback/`
   - `https://<production domain>/admin/auth/callback/`
3. Make the user an admin. This needs your OK:
   ```sql
   insert into carinfo.admins (user_id) select id from auth.users where email = '<your email>';
   ```
4. Open `/admin/login/`, request the link and open it in the **same browser**. Then try the queue, one review page
   and the error-report inbox.
5. The built-in Supabase mailer sends only a few emails per hour. If links stop arriving, set up custom SMTP.

Known limits:
- Edits show on public pages after up to 1 hour, because public fetches revalidate every 3600 s.
  Possible follow-up: tag-based revalidation.
- Not yet tested: a real login, and an RLS test with a signed-in non-admin.

## 3. Commit (Claude, after your answer to question 2 in CARINFO-QUESTIONS)

Uncommitted:
- the admin site: `src/app/admin/`, `src/lib/adminAuth.ts`, `src/lib/adminAuth.test.ts`, `src/lib/adminData.ts`;
- `report.ts`: `--all`, a fixed summary count and a fixed prompt title;
- `verify.ts`: the fix pass keeps engine names;
- the exported REST constants in `carinfoDb.ts`;
- this file.

Nothing is pushed; the branch is `feat/car-guide`.

## 4. Finish the full report run (Claude, across subscription windows)

- Resume with `node scripts/carinfo/report.ts --all --jobs 3`. It skips finished generations and goes in order of
  registrations. About 660 generations are left, roughly 60 per subscription window at 3 jobs.
- Retry the failures: `smart-fortwo/c453`, plus any listed in `data-raw/carinfo/reports/errors/`.
- Then run `node scripts/carinfo/verify.ts` on the ~80 unchecked answers. Its last run stopped at the limit on
  its first item.
- Then run `import.ts` and load the SQL (you, as in step 1). Doing this in batches as runs finish is fine.
- Decide question 7b first: who loads ~800 × 14 KB of SQL, you in the editor or Claude through the MCP.

## 5. Photos (you, then Claude)

1. Create the Cloudflare R2 bucket `cargregator` and connect a custom domain (suggested `cars-img.jelnikar.dev`).
2. `! npx wrangler login`
3. Claude runs `node scripts/carinfo/images.ts upload`, then `IMG_BASE=https://<domain> node scripts/carinfo/images.ts sql`.
4. Load that SQL (you). Photos never go in the repo or in Supabase.

## 6. Visual check (you, or Claude once a browser works)

- Install the libraries Playwright's Chromium needs (the command is in CARINFO-QUESTIONS 3a) so Claude can take
  phone and desktop screenshots itself.
- Pages to look at: `/sl/avti/`, a make page, a model page with a report (Golf), an engine page, the
  search results card, the check-car panel and `/admin`.

## 7. Content decisions (you, see CARINFO-QUESTIONS 3–10)

- German-heavy sources: OK, or push for Slovenian and English ones?
- Repair cost estimates: show, show as bands only, or hide until reviewed?
- "Avoid" verdicts: show while only AI-checked, or only after review?
- Photo credits: a line under each photo?
- Sonnet or Opus for engine verdicts, and what to do about runs that disagree (7a)?
- ADAC link, the search engine for Euro NCAP/TÜV fallback links, logos for the 9 makes that show initials.

## 8. Review (you, in /admin, after step 2)

- Hand-review the ~100 most registered generations and engines first; the queue is already sorted that way.
- Work the error-report inbox.
- Everything else stays public with the "AI-assisted, not reviewed" note.

## 9. Later

- Engine-level reports for the top ~100 engine combinations.
- Advisor: a token picker and SQL views, then a chat limited to models in the database.
- Push the branch, open a PR and deploy (Cloudflare Workers / OpenNext). Check that `/admin` works on Workers:
  cookies, server actions and the auth redirects.
