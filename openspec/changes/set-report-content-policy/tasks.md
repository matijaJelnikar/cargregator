# Tasks

## 1. Decisions

- [x] 1.1 (Matija) Answer CARINFO-QUESTIONS 3–10 (decisions 1–6 in design.md) and record the answers in design.md

## 2. Policy

- [x] 2.0 Hotfix: unreviewed "avoid" shows as "known issues" (`publicVerdict` in `carinfoDb.ts`), deployed first

- [ ] 2.1 Add `src/lib/reportPolicy.ts` (verdict and cost display per status) with unit tests
- [ ] 2.2 Use it in `CarReport.tsx`, `CarInfoCard.tsx` and the engine page; update the sl/en dictionary strings
- [ ] 2.3 `ReportNote`: unreviewed note vs "reviewed on <date>"

## 3. Sources and links

- [ ] 3.1 Prompt: prefer Avto magazin, Honest John and What Car? where they cover the generation
- [ ] 3.2 `carLinks.ts`: drop the ADAC breakdown link; keep Google as the fallback search
- [ ] 3.3 Periodic link check: hide failures whose sources all died (script plus SQL; **Supabase write**, Matija OK)
