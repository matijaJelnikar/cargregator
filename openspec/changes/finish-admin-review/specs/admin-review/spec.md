# Spec Delta

## Purpose

Lets the site's admins sign in to a private review site and check, correct, approve or withdraw AI-written car
reports, and handle error reports sent by the public.

## ADDED Requirements

### Requirement: Admin-only access
The review site SHALL be reachable only by accounts listed as admins. Everyone else SHALL be sent to the login page,
and any write SHALL be refused by the database, not only by the page.

#### Scenario: Signed-out visit
- **WHEN** a signed-out visitor opens `/admin/`
- **THEN** they are redirected to `/admin/login/`

#### Scenario: Signed-in non-admin
- **WHEN** a signed-in account that is not in `carinfo.admins` opens `/admin/`
- **THEN** the login page says the account is not an admin and no report data is shown

#### Scenario: Forged session
- **WHEN** a request carries a session cookie with a token not signed by Supabase
- **THEN** it is treated as not an admin

### Requirement: Magic-link sign-in
An admin SHALL sign in by requesting an email link for an existing account. The link SHALL only work in the browser
that requested it. No sign-up SHALL be possible.

#### Scenario: Link opened in the same browser
- **WHEN** an admin requests a link and opens it in the same browser
- **THEN** they land on the review queue, signed in

#### Scenario: Unknown email
- **WHEN** someone requests a link for an email with no account
- **THEN** no account is created and no link is sent

### Requirement: Review queue
The queue SHALL list generations with open error reports first, then by registrations. It SHALL filter by make,
status and low AI confidence.

#### Scenario: Open error report
- **WHEN** a generation has an unresolved error report
- **THEN** it appears above generations without one and shows the report count

### Requirement: Edit and approve
An admin SHALL be able to edit a report's summary, pros and cons, engine verdicts, failures and checklist, remove
links, and set the generation to reviewed, back to the queue, or withdrawn from the site.

#### Scenario: Approve
- **WHEN** an admin approves a generation
- **THEN** it and all its still AI-checked engines, failures and checks become reviewed

#### Scenario: Pros and cons out of step
- **WHEN** the Slovenian and English pros have a different number of lines
- **THEN** nothing is saved and the page explains why

### Requirement: Edits reach the public site promptly
A saved admin change SHALL appear on the affected public car pages within one minute.

#### Scenario: Verdict changed
- **WHEN** an admin changes an engine verdict from avoid to ok
- **THEN** the model and engine pages show ok within a minute

### Requirement: Error-report inbox
Admins SHALL see public error reports, newest first, linked to their generation, and mark them resolved or reopen
them.

#### Scenario: Resolve
- **WHEN** an admin marks a report resolved
- **THEN** it leaves the open list and the generation's report count drops by one
