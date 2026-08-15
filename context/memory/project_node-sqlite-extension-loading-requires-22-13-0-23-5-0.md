---
id: P-VHLMEE6P
type: project
shape: Timeless
title: Node-sqlite Extension Loading Requires 22.13.0/23.5.0
created_at: 2026-07-21T18:43:17Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 43d21ff1d7da82152e5c492cba57440464d434233e06f2377c96ec07d8f9688b
related: [v0-6-2-published-release-state-and-contents, research-notes-indexed-via-research-index-not-documentation, platform-specific-cut-gate-structure-and-scope]
---

Node-sqlite's extension loading (binary swap in v13) landed in **22.13.0 / 23.5.0**, not 22.5. The floor for the module *appears* at 22.5 but the feature needed for this PR's test requires the later minor.

**Why:** Core-memory-kit's doc-walk and validator had the version wrong in three locations; incorrect floor blocks correct binary checks

**How to apply:** When setting Node floors for any dependency that uses native extensions, verify against Node release notes — "module appears" vs "feature stable" can differ
