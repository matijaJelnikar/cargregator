# Tasks

## 1. Commit

- [ ] 1.1 (Matija) Choose: commit in chunks on `feat/car-guide` and open a PR, or merge straight to main
  (CARINFO-QUESTIONS 2)
- [ ] 1.2 Commit the admin site (`src/app/admin/`, `src/lib/adminAuth*.ts`, `src/lib/adminData.ts`, the
  `carinfoDb.ts` export)
- [ ] 1.3 Commit the script fixes (`report.ts --all` and its summary count, the prompt title, `verify.ts` engine
  names)
- [ ] 1.4 Commit `openspec/`, `.claude/` and `.opencode/` (OpenSpec skills), `docs/CARINFO-TODO.md` and AGENTS.md

## 2. Release

- [ ] 2.1 `npx tsc --noEmit`, `npx vitest run`, lint, `next build` and the OpenNext build
- [ ] 2.2 Push the branch; open a PR with a summary of the car guide, admin site and pipeline
- [ ] 2.3 (Matija) Review and merge
- [ ] 2.4 Deploy to Workers

## 3. Production checks

- [ ] 3.1 The car guide pages render with live data (make grid, a model with a report, an engine page, the sitemap)
- [ ] 3.2 `/admin` on Workers: login link, callback, refresh route, one save action, logout
- [ ] 3.3 Production callback URL added in Supabase Auth (finish-admin-review 1.2)
