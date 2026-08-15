---
id: P-6SQ499S6
type: project
shape: State
title: Name Guard Validator Skips Untracked Files
created_at: 2026-07-10T20:01:47Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 5a6a7e527844cf9b487b6caf07e4d46a13d646d556fd43530eeaa7df1faa722e
related: [decision-log-validation-gap-d-nnn-ids, kit-name-privacy-validator-for-auto-extract, updating-cmk-requires-re-running-bootstrap-on-project-files]
---

The name-guard validator in CI does not scan untracked files. This gap allowed sensitive content in wiki/raw/ to bypass validation. Task 214 filed to fix it.

**Why:** Incident D-310: content in an untracked wiki/raw/ path leaked through CI without being caught by the name guard.

**How to apply:** Until Task 214 is resolved, assume untracked files bypass name-guard validation. Be explicit about which files must be scanned, or track them in git.
