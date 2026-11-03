## ADDED Requirements

### Requirement: Source-backed European additions
Each addition SHALL have verified generation identity, European engine specifications, a bilingual report with checked claim sources, and an explicit source audit. Weak evidence SHALL be identified; editorial scores SHALL NOT be presented as measured failure rates. Research SHALL not invoke Claude.

#### Scenario: Provisional backlog candidate
- **WHEN** an absent generation is selected from the coverage audit
- **THEN** its candidate dates and labels are verified before import and unresolved aliases block export

### Requirement: Photograph included in the generation insertion
Every newly exported addition SHALL include an uploaded, visually reviewed, generation-matched freely licensed photograph. Its `image_url`, `image_credit`, `image_license` and `image_source_url` SHALL be included directly in the generation INSERT. Image binaries SHALL live in R2, not in SQL or the repository.

#### Scenario: Complete addition
- **WHEN** the user runs one prepared generation/batch SQL file
- **THEN** the generation, engine variants, checked report and image attribution are inserted in one database transaction, without a later image attachment script

#### Scenario: Missing or unreviewed photo
- **WHEN** the photo metadata is absent, unreviewed, unpublished, non-free, or names a different target
- **THEN** the addition exporter rejects the batch rather than silently publishing a car without its image

#### Scenario: Image before database ID exists
- **WHEN** an absent generation's photo is published
- **THEN** the object key can be generated without a database UUID and the public image is checked before marking the photo uploaded

### Requirement: Preserve existing content and atomic insertion
SQL SHALL preserve existing exact targets and siblings, reject alternate aliases and roll back the entire batch on failure. Supabase mutations SHALL remain the user's execution step unless explicitly authorised.

#### Scenario: Already inserted car
- **WHEN** a batch encounters an existing generation, including reviewed or manually edited content
- **THEN** it makes no changes to that generation; any missing-image repair is prepared separately and explicitly

### Requirement: Honest progress reporting
The backlog SHALL distinguish candidates, researched additions, ready SQL and confirmed production loads.

#### Scenario: Batch prepared locally
- **WHEN** reports and SQL are ready but no production load is verified
- **THEN** the candidate remains absent in coverage counts and is recorded as prepared, not loaded
