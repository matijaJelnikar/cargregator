# Spec Delta

## Purpose

Defines which AI-written car reports reach the public site and when, so only checked, sourced content is shown and
human-reviewed content is never overwritten by a later import.

## ADDED Requirements

### Requirement: Only checked reports are imported
A report SHALL be turned into SQL only after the check pass has run on it. Failures the check marked unsupported, and
links or sources that failed the HTTP check, SHALL be dropped.

#### Scenario: Unchecked answer
- **WHEN** `import.ts` runs while some answers have no check result
- **THEN** those answers are skipped and listed as "not checked" in the import report

#### Scenario: Unsupported failure
- **WHEN** a checked report has one failure marked unsupported
- **THEN** the generated SQL contains the other failures and not that one

### Requirement: Weak reports are held back
A report whose sources mostly failed SHALL NOT be imported unless forced, and SHALL be listed with its reason.

#### Scenario: Most sources dead
- **WHEN** more than half of a report's cited URLs failed the HTTP check
- **THEN** the report is listed as held back and no SQL is written for it

### Requirement: Reviewed content is kept
Loading a report SHALL NOT change a generation, engine, failure or check that an admin has marked reviewed.

#### Scenario: Re-import after review
- **WHEN** a new report for a reviewed generation is loaded
- **THEN** the reviewed summary, verdicts, failures and checks are unchanged

### Requirement: Public visibility follows status
The public site SHALL show a generation's report only when its status is ai_checked or reviewed. A generation without
a report SHALL still show its engines and recalls.

#### Scenario: Report taken off the site
- **WHEN** an admin sets a generation back to skeleton
- **THEN** its model page shows engines and recalls but no report sections

### Requirement: Coverage is reported
Each import SHALL report how many generations are written, checked, imported and held back, out of all generations.

#### Scenario: Partial run
- **WHEN** import runs after 300 generations are written and 250 checked
- **THEN** the import report states 300 written, 250 checked, the number imported and held back, and the 818 total
