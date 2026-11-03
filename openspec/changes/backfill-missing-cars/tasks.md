# Tasks

- [x] Capture a read-only production inventory and identify why older generations are missing.
- [x] Prepare a reproducible missing-car backlog, distinguishing absent generations from absent taxonomy models and from held-back reports.
- [x] Research Legacy IV using European manufacturer material and relevant Slovenian/technical sources, without Claude.
- [x] Prepare one sl/en report with short labels, precise engine variants and explicit evidence limits.
- [x] Prepare insert-only SQL under `data-raw/carinfo/sql/`; do not execute remotely.
- [x] Validate the SQL locally for correct counts, repeat-run safety, sibling protection, alias detection and atomic rollback.
- [ ] (Matija) Review `data-raw/carinfo/pilots/subaru-legacy-iv/preview.md` and insert `data-raw/carinfo/sql/pilot-subaru-legacy-iv-20261103.sql` if suitable (**Supabase write**, performed by Matija; no agent execution authorised).
- [ ] (Matija) Compare the rendered sl/en text with the Sonnet reports and approve or adjust the style before more summaries are written.
- [ ] After the quality decision, source-check the next backlog entries, resolve taxonomy/variant aliases and prepare further local SQL batches.

Evidence: `docs/MISSING-CAR-CATALOGUE.md`, `docs/SUBARU-LEGACY-IV-PILOT.md` and local pilot artifacts. The initial list contains 172 research candidates, not 172 verified imports. No bulk report generation is authorised before the pilot review.
