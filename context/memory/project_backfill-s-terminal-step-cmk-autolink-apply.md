---
id: P-Z9VT7FRE
aliases: [P-Z9VT7FRE]
type: project
shape: Timeless
title: Backfill's Terminal Step — `cmk autolink --apply`"
created_at: 2026-08-10T12:15:24Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 2f9bdd58d3f31568a9de567dad49fbd450f648479a137f6589e03524640f7611
related: [artifact-rebuild-for-v0-4-0, user-verdict-is-final-done-criterion-for-visual-work, v0-5-2-release-code-complete-awaiting-final-ci]
---

Corpus backfill's final step is running `cmk autolink --apply`, which applies all autolinks to the corpus when prior stages complete.

**Why:** Clarifies the exact last action needed to close backfill

**How to apply:** After all prior backfill work finishes, run `cmk autolink --apply` to complete the entire corpus
