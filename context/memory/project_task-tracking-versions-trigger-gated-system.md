---
id: P-DVF5GQLT
type: project
shape: State
title: 'Task Tracking: Versions + Trigger-Gated System'
created_at: 2026-07-10T21:23:19Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e16ef80e7c518e882429ced1b704327eb984eb7afd16e0c312761d12bbe23409
related: [d-408-housekeeping-supersedes-d-395, minor-release-triggers-backlog-sweep, kit-versioning-uses-lane-themed-releases-not-strict-semver]
---

Project tracks 51 top-level tasks (68 total with sub-tasks) using hybrid scheme:
- **Versioned (~30 tasks):** Committed to specific versions (v0.5.1, v0.5.2, v0.5.3, v0.5.4)
- **Trigger-gated (~21 tasks):** Conditional work NOT version-pinned; each has named trigger
- Sub-tasks inherit parent's lane by design
- Validator confirms 100% coverage: all 51 top-level have lane or trigger

Design philosophy (D-267, D-248, D-157): Avoid pinning conditional work to versions to prevent "fabricated commitments that slip"

**Why:** Defines how work is organized and released; future sessions must understand the hybrid approach and why conditional work is trigger-gated rather than forced into versions.

**How to apply:** When adding tasks, categorize as versioned (definite work) or trigger-gated (conditional). When reviewing version assignments, refer to D-267 justification.
