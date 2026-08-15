---
id: P-XaK9PK3Z
type: project
shape: State
title: Doc Validation System Metrics
created_at: 2026-07-29T08:20:34Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 84e1352dcc9ed8c6e59cb7e8e9ac6b6646691766c0953b565d89ae83dc9499ad
related: [multi-surface-documentation-architecture, doc-completeness-validator-hook-behavior-coverage-gap, documentation-taxonomy-and-update-responsibility]
---

Established doc-validator with five check families across corpus:
  - 42 registered docs
  - 424 decision citations (all resolving)
  - 13 MCP tools / 42 CLI verbs / 13 health checks tracked consistently across 62 living docs

**Why:** Provides automated assurance that documentation stays accurate and complete as codebase evolves

**How to apply:** When shipping features or releases, doc-validator gates verify consistency; if it reports issues, address them before cut
