# Tasks

- [x] Capture a read-only production inventory and identify why older generations are missing.
- [x] Prepare a reproducible missing-car backlog, distinguishing absent generations from absent taxonomy models and from held-back reports.
- [x] Research Legacy IV using European manufacturer material and relevant Slovenian/technical sources, without Claude.
- [x] Prepare one sl/en report with short labels, precise engine variants and explicit evidence limits.
- [x] Prepare insert-only SQL under `data-raw/carinfo/sql/`; do not execute remotely.
- [x] Validate the SQL locally for correct counts, repeat-run safety, sibling protection, alias detection and atomic rollback.
- [x] (Matija) Review the Legacy IV pilot and insert it (**Supabase write**, performed by Matija). Read-only verification, 2026-11-03: `subaru-legacy/bl-bp` is public with `ai_checked` status; production has 819 generations.
- [x] (Matija) Approve the pilot's style before more summaries are written — explicit approval, 2026-11-03: "this seems ok to me ... add them".
- [x] Prepare and locally validate the first post-approval batch: Forester II, Impreza II and Outback III (19 variants, three bilingual reports).
- [x] Specify and implement photos in generation INSERTs: visual review, licence/source/credit, R2 publishing before DB insertion, public URL verification and export rejection when incomplete.
- [x] Regenerate batch 001 with image fields and validate all-or-nothing insertion locally.
- [ ] (Matija) Attach photos to the two already loaded image-less batch-001 rows using explicit correction SQL (**Supabase write**).
- [x] (Matija) Load batch 001 (**Supabase write**, performed by Matija). Read-only verification: 822 generations; Forester image attached, Impreza/Outback image fields empty. Refreshed backlog: 168 absent candidates.
- [x] Research Golf IV, write the bilingual report, publish its reviewed photo and validate complete batch-002 SQL (21 variants, 14 assessments, four risks, eight checks).
- [ ] (Matija) Load batch 002 (**Supabase write**) and refresh the read-only coverage snapshot.
- [ ] Continue the 167 other research candidates; next priority is Golf V, Passat B6 and Polo IV.

Evidence: `docs/MISSING-CAR-CATALOGUE.md`, `docs/SUBARU-LEGACY-IV-PILOT.md`, `docs/MISSING-CAR-ADDITIONS.md` and local research artifacts. The initial list contains 172 research candidates, not 172 verified imports. Style review is complete; source-checked batch preparation is authorised. Production SQL loads remain Matija's step, and Claude remains unused.
