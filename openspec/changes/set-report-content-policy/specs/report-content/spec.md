# Spec Delta

## Purpose

Defines how much of an AI-written car report the public sees before a human has reviewed it, so that sensitive
claims carry the right caveat or wait for review.

## ADDED Requirements

### Requirement: Review state is visible
Every public report SHALL say whether it is AI-assisted and unreviewed, or reviewed by the site.

#### Scenario: AI-checked report
- **WHEN** a model page shows a report with status ai_checked
- **THEN** it shows the "AI-assisted, not reviewed" note next to the report

#### Scenario: Reviewed report
- **WHEN** the report's status is reviewed
- **THEN** the note says it was reviewed, with the review date

### Requirement: Sensitive verdicts follow the policy
An "Avoid" engine verdict on a report that is only AI-checked SHALL be displayed according to the chosen policy:
either shown with the unreviewed note, or replaced by a neutral "known issues, see below" until reviewed.

#### Scenario: Unreviewed avoid
- **WHEN** an engine's verdict is avoid and its generation is ai_checked
- **THEN** the page shows what the chosen policy specifies, and never shows avoid without the unreviewed note

### Requirement: Repair costs follow the policy
Repair cost figures SHALL be displayed according to the chosen policy (exact range, low/medium/high band, or
hidden until reviewed), and any figure shown SHALL say it is an estimate for an independent garage in Slovenia.

#### Scenario: Cost shown as a band
- **WHEN** the policy is bands and a failure's estimate is 800–1200 €
- **THEN** the page shows the band for that range and the estimate note, not the numbers

### Requirement: Every claim keeps its source
A failure shown to the public SHALL link to at least one source that passed the HTTP check.

#### Scenario: Source died after import
- **WHEN** a later link check finds all of a failure's sources dead
- **THEN** the failure is hidden until it is re-sourced or reviewed
