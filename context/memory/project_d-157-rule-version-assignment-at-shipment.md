---
id: P-2KJXNF25
type: project
title: D-157 Rule — Version Assignment at Shipment
created_at: 2026-07-01T09:02:55Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: f3268a77fbe80c355cdd7cb5eabcca90e1ba273befd2325a1b6e1015ba3d32fe
related: [tag-ready-criterion-core-features-pass-known-issues-cleanly, release-lane-independence-pattern, patch-release-strategy]
---

Version digits are assigned when tasks ship, not before. Pre-assigning versions to unshipped or deferred tasks violates this rule. Example: assigning 184 to v0.5 before the design decision is made is incorrect; tail tasks get their version number when cut, not in advance.

**Why:** Pre-numbering creates false structure that misrepresents development reality and can lead to incorrect release planning.

**How to apply:** When planning a release, assign versions only to tasks that are actually shipping. Tasks in design/curation phases or deferred work should have no pre-assigned version; they receive one when they're ready to ship.
