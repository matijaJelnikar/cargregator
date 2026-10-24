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

Decided by Matija, 2026-10-24:
1. **"Avoid" while unreviewed:** shown (with the unreviewed note) only for engines with ≥2 supported failures;
   otherwise "known issues". A reviewed generation shows the reviewer's verdict.
   - Hotfix already live: `publicVerdict()` in `carinfoDb.ts` turns every unreviewed "avoid" into "issues"
     ("Known issues" / "Znane težave"). The full rule replaces it.
2. **Repair costs:** low/medium/high bands until reviewed, exact ranges after.
3. **Sources:** keep German sources; a prompt line prefers Avto magazin, Honest John and What Car? where they cover
   the generation. New runs only; existing reports are not rewritten.
4. **Disagreeing runs (7a):** accepted as is. No second verdict run; the ≥2-supported-failures rule guards "avoid".
5. **Links:** drop the generic ADAC breakdown link; keep Google as the fallback search.
6. **Logos:** keep initials for the 9 makes.

Implementation: `src/lib/reportPolicy.ts` exports `verdictDisplay(engine, gen)` and `costDisplay(failure, gen)`,
used by `CarReport`, `CarInfoCard` and the engine page. Unit tests cover each status.

## Risks / Trade-offs

- **Hiding "avoid"** makes reports less useful. Showing it unreviewed risks a wrong claim. The note plus the
  "≥2 supported failures" rule balances the two.
- **No second verdict run:** two runs can still disagree on "ok" vs "recommended"; accepted.
