---
id: P-VBQUL9US
aliases: [P-VBQUL9US]
type: project
shape: State
title: Memory Fact Validation — Task Reference Exemption
created_at: 2026-08-03T13:49:43Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 265f2fa2b82242e1e7c026ca174399a522c3d7c0c63e0740ac10c720353aec2b
related: [validate-references-requires-properly-filed-task-references, kit-s-strict-forward-reference-validation, reference-implementation-alignment-strategy]
---

`validate-docs` should not flag forward references to non-existent tasks/items within captured memory facts.
Memory captures record what was *said*; a forward reference ("Task 260") is historically accurate even if the referent doesn't exist yet.
Aligns with existing exemption for file links in `context/` directory.

**Why:** Distinguishes between drift (inaccurate content) and accurate capture (what was stated, even if the referent isn't created yet)

**How to apply:** When extending `validate-docs` memory checks, apply forward-reference exemption consistently across all identifier families (tasks, branches, features, etc.)
