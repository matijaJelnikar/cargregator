# Proposal

## Why

Reports make claims that can hurt a buyer or a brand if they are wrong: "Avoid" verdicts, repair cost estimates,
failure lists. These are AI-written and only AI-checked. The rules for what is shown before a human has reviewed
it are still open (CARINFO-QUESTIONS 3–10). They should be decided once and enforced in the UI, not left to each
page.

## What Changes

- Decide, then implement, the display rules for content that is only AI-checked:
  - "Avoid" verdicts;
  - repair cost figures;
  - the "AI-assisted, not reviewed" note.
- Decide the source preference: keep the German-heavy sources (ADAC, TÜV), or push the prompt toward Slovenian and
  English ones (Avto magazin, Honest John, What Car?).
- Product decisions:
  - keep or drop the generic ADAC breakdown link;
  - the search engine used for Euro NCAP/TÜV fallback links;
  - logos for the 9 makes that show initials.
- How to handle runs that disagree on a verdict (7a): accept, run twice and keep only the agreed failures, or use
  Opus for verdicts.

Out of scope: the review workflow itself (finish-admin-review).

## Capabilities

### New Capabilities
- `report-content`: what report content the public sees, depending on whether it is AI-checked or human-reviewed.

### Modified Capabilities

## Impact

- `src/components/CarReport.tsx`, `CarInfoCard.tsx`, the engine page, and the dictionaries (sl/en).
- Maybe `scripts/carinfo/report.ts` (prompt sources, a second run for verdicts) and `src/lib/carLinks.ts`.
- Needs Matija's decisions first (tasks group 1).
