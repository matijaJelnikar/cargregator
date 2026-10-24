# Spec Delta

## Purpose

Shows each car generation with a freely licensed photo from our own image host, credited as its licence requires,
and degrades cleanly when a generation has no photo.

## ADDED Requirements

### Requirement: Freely licensed photos only
A generation photo SHALL come from a source whose licence allows reuse (public domain, CC0, CC BY or CC BY-SA), and
its licence, author credit and source page SHALL be stored with it.

#### Scenario: Non-free image found
- **WHEN** the only image found for a generation is under a non-free or unknown licence
- **THEN** no photo is stored for that generation

### Requirement: Credit shown
Every displayed photo SHALL show its credit and licence, linked to the source page.

#### Scenario: CC BY-SA photo
- **WHEN** a model page shows a CC BY-SA photo
- **THEN** a line under it names the author and licence and links to the Commons page

### Requirement: Served from our image host
Photos SHALL be served from the site's own image domain on R2, never hot-linked from the source and never stored in
the repository or the database.

#### Scenario: Image URL
- **WHEN** a generation has a photo
- **THEN** its URL starts with the configured image base and the source site is only linked in the credit

### Requirement: Matching generation
A stored photo SHALL show the generation it is attached to, and the same photo SHALL NOT be attached to two
different generations of one model.

#### Scenario: Facelift duplicate
- **WHEN** the recheck finds the same image attached to two generations
- **THEN** it is kept only on the generation it belongs to

### Requirement: No photo, no gap
A generation without a photo SHALL show the page without a broken image or an empty frame.

#### Scenario: Missing photo
- **WHEN** a generation has no image_url
- **THEN** the hero shows the make logo placeholder and the rest of the page is unchanged
