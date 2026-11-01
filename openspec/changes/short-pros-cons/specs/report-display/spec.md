# Spec Delta

## ADDED Requirements

### Requirement: Pros and cons collapse to short labels
When every pros/cons item of the shown generation has a short label in the page language, the model page SHALL show
the items as short-label chips (pros in the success tone, cons in the warning tone) and SHALL NOT show the full
sentences until the reader expands them.

#### Scenario: Generation with labels
- **WHEN** a model page shows a generation whose pros and cons all have `short` labels
- **THEN** each item appears as one chip with its label in the page language, pros and cons in separate rows

#### Scenario: Switching generation
- **WHEN** the reader selects another generation with the generation switcher
- **THEN** the chips show that generation's labels and the block is collapsed

### Requirement: One toggle reveals the full text
The block SHALL have a single "Show more" / "Show less" toggle that switches all items between labels and the
full-sentence lists. It SHALL be keyboard-operable and expose its state with `aria-expanded`.

#### Scenario: Expand
- **WHEN** the reader activates "Show more"
- **THEN** the pros and cons show as the full-sentence lists and the toggle reads "Show less"

#### Scenario: Collapse
- **WHEN** the reader activates "Show less"
- **THEN** the block returns to chips

### Requirement: No partial labels
If any pros/cons item of the shown generation lacks a short label, the page SHALL show the full-sentence lists for
that generation with no toggle.

#### Scenario: Report not yet shortened
- **WHEN** a generation's pros/cons have no `short` field (or only some items do)
- **THEN** the page shows the full-sentence lists as before and no toggle

### Requirement: Labels are short
A short label SHALL be 1–32 characters in each language and SHALL say the same thing as its full sentence.

#### Scenario: Import validation
- **WHEN** `import.ts` exports a report whose items lack `short` or have a label over 32 characters
- **THEN** that report is not exported and import-report.md lists it as needing shorten
