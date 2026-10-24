# Tasks

## 1. Decisions

- [ ] 1.1 (Matija) Answer CARINFO-QUESTIONS 3–10 (decisions 1–6 in design.md) and record the answers in design.md

## 2. Policy

- [ ] 2.1 Add `src/lib/reportPolicy.ts` (verdict and cost display per status) with unit tests
- [ ] 2.2 Use it in `CarReport.tsx`, `CarInfoCard.tsx` and the engine page; update the sl/en dictionary strings
- [ ] 2.3 `ReportNote`: unreviewed note vs "reviewed on <date>"

## 3. Sources and links

- [ ] 3.1 Prompt: the preferred Slovenian/English sources (if chosen)
- [ ] 3.2 `carLinks.ts`: drop or keep the ADAC breakdown link; set the fallback search engine
- [ ] 3.3 Periodic link check: hide failures whose sources all died (script plus SQL; **Supabase write**, Matija OK)

## 4. Verdict agreement (if chosen)

- [ ] 4.1 `report.ts --verdicts-only` second run for the top ~100 generations; mark verdicts both runs agree on
- [ ] 4.2 Import: only agreed "avoid" verdicts stay "avoid"; the others become "ok" with a note
