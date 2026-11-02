## Decisions
- Keep metadata and data loading on the server. ModelHero selects the generation and renders its buying guide.
- Opening copy is an extract of the existing summary, not a newly generated verdict. Intl.Segmenter preserves decimal engine sizes.
- Good choices only use recommended/ok verdicts. Caution only uses issues/avoid, including the existing public report policy.
- Prioritise verdict then score for good choices. Deduplicate names within each shortlist but retain exact variant data and links.
  The same name may appear in both columns when variants have different verdicts.
- Priority risks retain the existing likelihood × upper repair cost ordering. Every remaining failure stays accessible.
- All engine variants retain their individual assessments in the reference table; no single variant's verdict describes a generation.
- Switching generations resets disclosures and the pros/cons toggle. Existing generation hash links select the matching generation.
- Report sources and review status remain available from the hero. No missing-report recommendations are invented.

## Validation
- Seven unit tests cover variant conflicts, empty recommendations, source order, sentence excerpts and risk ranking.
- Chromium: Alfa 156 at 360/1280 px in light/dark; no overflow or browser errors.
- Chromium: Golf generation switching, pros/cons reset, search-year filters, engine table opening, and #mk7 deep link.
- Chromium: English overview, MG4 labels/fallback, and Nissan Ariya with no published report.
- Source content, report policy and database data are unchanged.
