# Tasks

## 1. Decisions

- [x] 1.1 (Matija) Answer CARINFO-QUESTIONS 3–10 (decisions 1–6 in design.md) and record the answers in design.md

## 2. Policy

- [x] 2.0 Hotfix: unreviewed "avoid" shows as "known issues" (`publicVerdict` in `carinfoDb.ts`), deployed first

- [x] 2.1 Add `src/lib/reportPolicy.ts` (verdict and cost display per status) with unit tests
- [x] 2.2 Use it in `CarReport.tsx`, `CarInfoCard.tsx` and the engine page; update the sl/en dictionary strings
- [x] 2.3 `ReportNote`: unreviewed note vs "reviewed on <date>"

## 3. Sources and links

- [x] 3.1 Prompt: prefer Avto magazin, Honest John and What Car? where they cover the generation
- [x] 3.2 `carLinks.ts`: drop the ADAC breakdown link; keep Google as the fallback search
- [x] 3.3 Implement source-link audit and guarded candidate SQL — `scripts/carinfo/check-links.ts`; see `docs/SOURCE-LINK-AUDIT.md`. Full read-only run, 2026-11-02: 5,334 failures, 2,353 unique URLs, 2,208 reachable, 0 confirmed dead, 145 unknown; no SQL candidates and no Supabase writes. Unit tests and isolated PostgreSQL 16 validation cover reviewed/hidden content, intervening edits, and idempotency.
- [ ] 3.4 (Matija) Choose monitoring cadence/host; review future dead-source candidates and authorize any hiding SQL (**Supabase write**, explicit OK required). No recurring job is installed. Question recorded in `docs/QUESTIONS-FOR-MATIJA.md`.
