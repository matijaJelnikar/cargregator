# Tasks

## 1. Account setup

- [ ] 1.1 (Matija) Supabase → Authentication → Users → add a user with your email
- [ ] 1.2 (Matija) Supabase → Authentication → URL Configuration: add `http://localhost:3000/admin/auth/callback/`
  and `https://cars.jelnikar.dev/admin/auth/callback/`
- [ ] 1.3 (Matija) Run `insert into carinfo.admins (user_id) select id from auth.users where email = '<email>';`
  (**Supabase write**)

## 2. End-to-end check

- [ ] 2.1 (Matija) Request a link at `/admin/login/`, open it in the same browser, and land on the queue
- [ ] 2.2 Try each action on one generation: save summary, verdict, failure, check, remove link, approve, back to
  queue, withdraw. Confirm the public page reflects each one
- [ ] 2.3 RLS test via MCP read-only transaction. Read side passed 2026-10-24: a non-admin JWT sees 0 reports,
  0 hidden generations, 0 unsupported failures and 0 admins, and is_admin() is false. Still to do: the write side
  (an update as a non-admin changes 0 rows), inside a rolled-back transaction, with Matija's OK
- [x] 2.4 `get_advisors` (security), 2026-10-24: only two SECURITY DEFINER warnings. `carinfo.is_admin()` is
  intended (the admin check; it only reports on the caller). `public.rls_auto_enable()` is Supabase's event trigger
  and cannot be called through the API. Optional: `revoke execute` on both from anon (Matija's OK)

## 3. Prompt public updates

- [x] 3.1 Read the Next 16 docs for `revalidateTag` (two-argument form) and fetch `tags`. OpenNext is on its default
  config, so production has no incremental or tag cache: every request reads Supabase fresh
- [x] 3.2 Tag `getGenerations` per model (`carinfo:<model_id>`); report-changing admin actions call
  `revalidateTag(tag, { expire: 0 })`
- [ ] 3.3 If a Workers incremental cache is added later (R2/KV), add a tag cache too (D1 or DO), or tags do nothing
  there

## 4. Review

- [ ] 4.1 (Matija) Review the most-registered generations in the queue, top 30 first. Not a launch gate (2026-10-24):
  the site is live on AI-checked content under the report policy
- [ ] 4.2 (Matija) Work the error-report inbox
- [x] 4.3 Commit the admin site (see ship-car-guide)
