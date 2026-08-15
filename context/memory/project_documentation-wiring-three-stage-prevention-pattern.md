---
id: P-AG5FYCWH
type: project
title: 'Documentation Wiring: Three-Stage Prevention Pattern'
created_at: 2026-07-01T21:41:04Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 604bdf5a67255eba7e0dfbfda477bd7f3c5d2a0d55b859d69469bace658e6591
related: [d-249-doc-drift-walk-structural-update-guard, documentation-structure-and-prerequisite-locations, link-out-convention-for-design-md-evidence]
---

Close documentation rot with three structural stages:
- **Findable**: document in a registry (e.g., D-249 doc-drift walk)
- **Routed**: developer routed at session start (e.g., CLAUDE.md "Read these in order")
- **Kept-Alive**: update mandate per-change (must update or declare N/A)

**Why:** Prevents silent rot; makes doc debt visible structurally, not via memory

**How to apply:** New system docs need all three: registry entry, session routing directive, update-guard
