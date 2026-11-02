# Questions for Matija

Updated during the autonomous OpenSpec pass started 2026-11-02. No answer is needed while local work continues.
Existing decisions in OpenSpec remain in force; this file collects only unresolved decisions and production steps.

## Production steps

1. **Passat B9 short labels:** approve applying `data-raw/carinfo/sql/repair-passat-b9-short-labels-20261102.sql`? This is the only published generation missing labels (five pros and five cons); its full sentences match the local checked answer exactly. The cause was the text cleaner rewriting `evo2` to `evo 2`, which made the original backfill's sentence guard fail. The cleaner is fixed and regression-tested. The new patch checks sentences, AI-checked status and the exact timestamp, and reports its affected-row count. In isolated UTF-8 PostgreSQL it restores all ten labels and is a no-op on repeat. It remains unexecuted in Supabase. The current UI correctly falls back to full descriptions.
2. **Deployment:** after local validation, do you authorize deploying the reviewed code using the `ship-car-guide` routine? Deployment remains pending until authorized.
3. **Admin workflow:** when convenient, run the production login/callback/save/logout check. Saving, approving, withdrawing and editing reports are database writes, so the autonomous pass does not perform those actions against production.

## Content and operations

4. **Held-back reports:** 22 generations are listed as held back in the progress log. OpenSpec requests one Sonnet retry; whether that retry already happened needs verification before marking the task complete. Any report without adequate sources must remain held back.
5. **Periodic source monitoring:** what cadence should run the link audit, and where should it run? The local audit can prepare candidate SQL; hiding production failures still requires your explicit approval. Temporary rate limits and bot blocks must not be treated as evidence that a source disappeared.
6. **Missing engine assessments:** should factual, sourced summaries be publishable without a verdict/score when reliability evidence is insufficient? The current report contract requires both. Research and bilingual drafts are in `docs/MISSING-ENGINE-ASSESSMENTS.md`. The Superb IV petrol-labelled 1.5 TSI and Qashqai J12 petrol-labelled 1.3 DIG-T rows also need identity review: manufacturers describe those European launch powertrains as mild hybrids, and separate hybrid-labelled rows already exist. Do not silently merge them or copy ratings.
7. **Megane engine code:** approve the new `data-raw/carinfo/sql/repair-engine-codes-20261102.sql`? Renault's manual confirms H5D for the 999 cc 1.0 TCe. The exact Megane IV petrol/84 kW/999 cc null-code row is added to the scoped correction registry. The generated file has eleven targets: the ten original Dacia rows are already correct in production, so only the new Megane row should change. Isolated UTF-8 PostgreSQL tests confirm that result, repeat-run idempotency, and protection of reviewed/hidden content, manual codes and unexpected displacement. The archived original ten-row file remains in `sql/done/`. No verdict or score is assigned, and the new SQL remains unexecuted remotely.

## Completed independently

- Screenshot and interaction checks at mobile and desktop widths in both themes.
- Photo credits, missing-photo placeholders, and image-load checks on ten model pages.
- Primary-source research and factual drafts for the four omitted engine names; final assessment decisions remain in question 6.
- Local fixes, regression checks, and reconciliation of stale OpenSpec tasks with retained evidence.

## Session notes

- Initial localhost/browser sandbox restrictions were resolved by granting execution access; localhost is now reachable from Playwright. No further action is needed on that blocker.
- Local baseline: 190 unit tests pass; TypeScript passes; lint has five existing warnings and no errors.
- The admin font mismatch has been fixed and confirmed in the browser. All 32 standard screenshots returned 200 without horizontal overflow. Model-state checks passed at 360/1280 in both themes; the ten-model photo check passed at both widths.
- The final full source audit checked all 2,353 URLs across 5,334 public failures: 2,208 reachable, 0 confirmed dead, 145 unknown, no SQL candidates. Reviewed/hidden-content protection, intervening-edit guards and idempotency passed isolated PostgreSQL validation. See `docs/SOURCE-LINK-AUDIT.md`.
- The resumable short-label run found no work: `0 shortened, 0 failed, 0 not processed`.
- Refreshed progress is 796 exported, 22 held back, zero unchecked/failed/not-started. A fresh read-only public snapshot contains exactly the same 796 generation IDs with `ai_checked` status; the main report-generation/load backlog was stale and has been reconciled.
- Engine child-row repairs are now independently verified as already applied: all 3,553 assessment values and all 1,262 exact failure links match the intended repairs. The loader matches the guarded local migration apart from whitespace, and all six affected Touareg diesel variants are recommended. These items no longer need an answer or another application; files are archived in `sql/done/`.
- Focused production pros/cons checks passed at 360/1280 in both themes, including the Passat fallback. Broader checks encountered intermittent navigation timeouts and a transient 503; a subsequent direct Golf GET returned 200. Local checks passed throughout.
- Fixed report/verification batch stopping on ordinary errors by replacing overly broad limit detection with the shared classifier. Removed the five existing unused-variable lint warnings. Production build, TypeScript, unit tests and lint pass.
- Fixed `evo2` corruption in `spaceNumbers` and added import/backfill regressions. The targeted Passat label patch passed isolated UTF-8 PostgreSQL validation; its original failure and the successful corrected run are retained in local validation logs.
- Final local verification: 218 tests pass, TypeScript and lint clean, production build passed, full local model-state matrix passes and focused production pros/cons matrix passes. Changes are committed locally on `codex/openspec-autonomous-20261102` for review.
- Remaining OpenSpec checks also include a real OpenCode headless websearch smoke call and the specified Sonnet retry for held-back reports. Existing fixtures alone do not establish a successful current websearch call, so that task remains unchecked.
