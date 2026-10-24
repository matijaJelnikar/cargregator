# Design

## Context

- `CarReport.tsx` renders verdict pills, failures with cost ranges, the checklist, the NCAP badge and `ReportNote`.
- `hasReport(gen)` is true for ai_checked and reviewed.
- No per-claim rules exist yet; everything that passed import is shown as is.

## Goals / Non-Goals

**Goals:**
- One place (a small policy module) decides how verdicts, costs and notes render for each status.

**Non-Goals:**
- Changing how reports are generated, except the optional prompt and source changes below.

## Decisions

Pending Matija; the recommended option comes first:
1. **"Avoid" while unreviewed:** show it with the unreviewed note, *or* show "known issues" until reviewed.
   Recommended: show it with the note for engines that have ≥2 supported failures, otherwise "known issues".
2. **Repair costs:** low/medium/high bands until reviewed, exact ranges after. Alternatives: always exact with the
   note, or hidden.
3. **Sources:** keep German sources, and add a prompt line that prefers Avto magazin, Honest John and What Car?
   when they cover the generation.
4. **Disagreeing runs (7a):** for the top ~100 generations, run verdicts twice and show "avoid" only when both runs
   agree; accept single runs elsewhere.
5. **Links:** drop the generic ADAC breakdown link. Fallback search: keep Google unless Matija prefers DuckDuckGo.
6. **Logos:** keep initials for the 9 makes. Commons logos are mostly trademark-only.

Implementation: `src/lib/reportPolicy.ts` exports `verdictDisplay(engine, gen)` and `costDisplay(failure, gen)`,
used by `CarReport`, `CarInfoCard` and the engine page. Unit tests cover each status.

## Risks / Trade-offs

- **Hiding "avoid"** makes reports less useful. Showing it unreviewed risks a wrong claim. The note plus the
  "≥2 supported failures" rule balances the two.
- **A second verdict run** doubles cost for the top generations only.
