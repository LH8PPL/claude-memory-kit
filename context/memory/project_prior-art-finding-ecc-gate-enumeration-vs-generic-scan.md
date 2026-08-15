---
id: P-7VYDGZSM
type: project
shape: Timeless
title: 'Prior-Art Finding: ECC Gate Enumeration vs Generic Scan'
created_at: 2026-07-20T18:12:58Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 8b289421b4f0f56bc8cfb3dfc26e0d6d7fcabedeb3336be09dee0821f79b43cd
related: [task-236-enumeration-anti-pattern-prior-art-finding]
---

ECC's gate hand-enumerates 40 doc locations for staleness checks; gate runs green despite at least one location 4 months stale. Evidence: enumeration is wrong shape (staleness occurs in the 41st unlisted place).
- Generic scan catches staleness anywhere; enumerated checks have dead spots.
- Applied to Task 236: counts family gates use generic scan, not enumeration.

**Why:** Prior-art triage finding that directly motivated architecture choice for Task 236.

**How to apply:** For gate design, prefer generic scans over enumerated lists. Enum-based gates have known failure mode.
