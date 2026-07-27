---
id: P-5G3JD4V2
type: project
shape: Preference
title: Reference Implementation Alignment Strategy
created_at: 2026-07-27T07:42:31Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 8129a077084c7fb47172b3bb99fbf5dd7dc13c217834502da0bf27e887a7ffa6
---

When a cross-implementation divergence is discovered (Node vs Python, etc.), the ruling is to align non-reference implementations to the reference (Node in this case) and pin the alignment with a parity vector in the branch. The parity harness is used to validate and document the alignment, not merely record a fork.

**Why:** This prevents silent divergence and makes the parity harness a tool for correctness, not just documentation.

**How to apply:** On future cross-implementation issues, use the same pattern: identify the reference, align others to it, pin in parity harness.
