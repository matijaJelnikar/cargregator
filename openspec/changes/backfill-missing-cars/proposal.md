# Backfill missing European cars with complete reports and photographs

The registration-led catalogue omits older generations of existing models and some entire models. A read-only audit initially found 172 candidate omissions. Matija has inserted and approved the Legacy IV pilot, leaving 171 candidates in that snapshot. Three further Subaru reports are prepared; the remaining 168 need source research. The candidate list is provisional, not a verified global catalogue.

Continue direct source research without Claude. Verify generation identities, European dates and engine variants; write bilingual reports to the approved pilot standard. Download and visually inspect a freely licensed photograph for each generation, retain its author/licence/source, publish it to the existing R2 host, and include all four image fields in the generation INSERT alongside the engines and report. A ready batch must be a single SQL file that Matija can run without a separate image attachment step.

Use stable image object keys that do not require a database UUID. Reuse an existing matching, publicly accessible upload where available. An existing generation remains untouched on re-run; previously inserted cars missing a photo get a separate explicit correction SQL, never an implicit report overwrite.

Deliver small verified batches, refresh the read-only inventory after Matija loads them, and retain progress and source audits. Next research priorities are Golf IV/V, Passat B6 and Polo IV; missing taxonomy models need their own identity and site-adapter checks first.

Out of scope: executing Supabase mutations without Matija's explicit authorisation, deployment, new photo hosting, UI changes, worldwide historical coverage, US/Japanese-only engine ranges, and invented repair prices or failure statistics. Existing R2 publishing is part of batch preparation. Supabase SQL loads remain Matija's step.
