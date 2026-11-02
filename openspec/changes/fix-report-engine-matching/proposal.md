## Why
Exact-name matching silently dropped checked engine assessments and broadened engine-specific problems to all engines.
The Touareg exposed this issue; the audit found 498 affected published generations.

## What Changes
Validate and canonicalise report engine keys before export, separate names from prompt metadata, add database
loader guards, and generate narrowly guarded repair SQL for existing published rows.

Out of scope: inventing assessments omitted from source reports, changing verdicts with existing content, database
writes without Matija's explicit approval, or deploying unrelated UI changes.
