# Tasks

## 1. Account setup

- [ ] 1.1 (Matija) Supabase → Authentication → Users → add a user with your email
- [ ] 1.2 (Matija) Supabase → Authentication → URL Configuration: add `http://localhost:3000/admin/auth/callback/`
  and `https://<production domain>/admin/auth/callback/`
- [ ] 1.3 (Matija) Run `insert into carinfo.admins (user_id) select id from auth.users where email = '<email>';`
  (**Supabase write**)

## 2. End-to-end check

- [ ] 2.1 (Matija) Request a link at `/admin/login/`, open it in the same browser, and land on the queue
- [ ] 2.2 Try each action on one generation: save summary, verdict, failure, check, remove link, approve, back to
  queue, withdraw. Confirm the public page reflects each one
- [ ] 2.3 RLS test via MCP read-only transaction: a non-admin JWT claim updates 0 rows and reads no hidden rows
- [ ] 2.4 Run `get_advisors` (security) and confirm it is still clean

## 3. Prompt public updates

- [ ] 3.1 Read the Next 16 docs for `revalidateTag` and fetch `tags`; check OpenNext's tag cache on Workers
- [ ] 3.2 Tag public carinfo fetches per model; call `revalidateTag` from admin actions
- [ ] 3.3 Fallback if tags don't work on Workers: revalidate car pages every 300 s

## 4. Review

- [ ] 4.1 (Matija) Review the ~100 most-registered generations in the queue
- [ ] 4.2 (Matija) Work the error-report inbox
- [ ] 4.3 Commit the admin site (see ship-car-guide)
