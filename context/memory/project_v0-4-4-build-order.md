---
id: P-3LVHaFAY
type: project
title: v0.4.4 Build Order
created_at: 2026-07-02T08:33:07Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4157891bc0dfdb90ae92bc83af333b24d37bff64c2c2fd696767a8350f6638b2
related: [v0-6-4-release-workflow-and-task-ownership, v0-4-4-and-v0-5-0-build-phases, minor-release-triggers-backlog-sweep]
---

Development sequence for v0.4.4:
- 66.1 (shape field, TDD)
- 66.3 (expiry sweep)
- grill contradiction-detection design
- 66.2/66.4
- riders 150 (ADR-first), 141a (npm-12 HC)

Key constraint: `expires_at` field appears in zero source files — it is design-prose only, so task 66.3 covers both halves (accept field + enforce sweep).

**Why:** Confirms task sequencing and identifies that expires_at needs to be added to source as part of 66.3, not assumed to exist

**How to apply:** Follow this sequence when implementing v0.4.4; treat 66.1 as entry point, use TDD approach
