---
id: P-ZTaNPL3T
type: project
title: Decision Logging in Task Entries
created_at: 2026-06-30T07:18:15Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 36922265454516ead5d7cc6b6afd2ec1429bf9a1b5908b755df741f92585f513
related: [architecture-decisions-recorded-in-adrs, v0-3-5-patch-vs-v0-4-0-versioning-logic, d-157-rule-version-assignment-at-shipment]
---

Record key design decisions and their downstream implications in task entries. Example: task 151.6 noted that consuming the newly-added `trust_score` field is deferred until tasks 151.7/151.8, which triggers a re-eval of 151.5's design — this cross-task dependency was written into the task entry so it isn't lost.

**Why:** Preserves reasoning across sessions; prevents re-deriving the same design decision or losing dependency chains that feed into later work.

**How to apply:** When a decision has downstream effects, write it into the task entry explicitly. Use the decision log to capture triggers and rationale.
