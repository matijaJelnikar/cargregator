## Decisions
Prefer exact names, then unique case/whitespace normalisation, then verified parenthetical code metadata.
Preserve case-significant names such as Saab 2.0t versus 2.0T.
Require the suffix to equal the union of known codes for the exact base name; never fuzzy-match engines.
Reviewed aliases are scoped by model/generation and checked against the catalogue.
Canonicalise assessment keys and failure references together. Refuse duplicate, unknown or missing coverage.
Validate the same contract in the loader for existing SQL files. Lock and protect reviewed/hidden generations.
Audit with the publishable key and public RLS; repair only exported, AI-checked content matching its checked source.
Fill only empty assessment fields; never reload/delete reports. Link failures only when their checked text and sources match.
Repair guards preserve reviewed/hidden rows and later content edits. Full results and validation are in docs/ENGINE-IMPORT-AUDIT.md.
