---
id: P-52R6DV4B
type: project
shape: State
title: Stop-hook path budget constraint
created_at: 2026-07-07T19:40:23Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ebc8859e0f886c21713bf4fb8af3ed32e04f7e0eeb167a68d51e373244bf2f91
related: [reference-implementation-alignment-strategy, prior-research-outputs-d-218-and-d-227, defense-in-depth-scanning-write-read-boundaries]
---

The transcript write happens on the Stop-hook path with a ~500ms budget. This constrains design choices for the transcript screen implementation.

**Why:** Understanding this budget is critical to choosing between fast local methods (PII regexes) vs async approaches.

**How to apply:** When designing the transcript screening, check this budget and evaluate options against it.
