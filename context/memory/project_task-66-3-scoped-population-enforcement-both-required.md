---
id: P-a4CPUUQa
type: project
title: Task 66.3 Scoped — Population + Enforcement, Both Required
created_at: 2026-07-02T08:40:03Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 2c73a1db257c0934db3dbabd3ce0448b811a9fdeaf64cb9d0564ea833367c9f7
related: [expiry-mechanism-precedents-anti-patterns, task-66-1-complete-writefact-shape-field-validation, auto-extract-expiry-bounded-design-never-guesses]
---

- **The problem**: enforcement without population = dead weight (D-169 pattern—feature that never fires)
- **Solution**: Two population paths — (1) Auto-extract ephemeral facts (Plan-shaped) and auto-assign expires_at; (2) Explicit `--expires` flag on capture
- **Done-criteria**: assert field gets populated in real workflows without manual intervention; negative results (no real cases) are valid outcomes to record

**Why:** Earlier user feedback identified that expires_at (designed but unimplemented) risks becoming useless enforcement. The actual work is ensuring *something* populates the field, not building enforcement for a bare field.

**How to apply:** Build 66.3 as—auto-extract rules for Plan facts → --expires capture flag → measure real population in dogfood → record results (even if negative).
