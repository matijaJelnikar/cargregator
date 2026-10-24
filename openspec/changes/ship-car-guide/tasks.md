# Tasks

## 1. Done

- [x] 1.1 Car guide, pipeline and admin site committed and merged to `main` (PR #4 and later commits)
- [x] 1.2 First deploy to Workers; the car guide is live at https://cars.jelnikar.dev

## 2. Deploy routine (repeat for every code change)

1. `npx tsc --noEmit`, `npx vitest run`, lint, `next build`
2. Commit on `main` (or a branch and PR for larger work); `git push`
3. (Matija, or with his OK) `npm run deploy`
4. Probe production: `/sl/avti/`, a model with a report, an engine page, `/sitemap.xml`

- [ ] 2.1 First run: the "avoid" hotfix plus the commits not yet on origin

## 3. Production checks

- [ ] 3.1 `/admin` on Workers: login link, callback, refresh route, one save action, logout
- [ ] 3.2 Production callback URL added in Supabase Auth (finish-admin-review 1.2)
