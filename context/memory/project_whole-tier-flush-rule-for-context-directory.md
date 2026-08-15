---
id: P-GN773PaV
type: project
shape: State
title: Whole-Tier Flush Rule for Context Directory
created_at: 2026-07-27T19:14:12Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0fdc7a6e40482cc896f03ffcb588d793ebbf06448d16b60bf0bd711f63a49f8f
related: [memory-flush-consistency-unit, memory-kit-validates-itself-as-dogfood-test-subject, name-privacy-validator-scans-only-tracked-files]
---

`context/` is one consistency unit — all or nothing.

Discovered from staging incidents this week. Principle: treat the context directory as an atomic unit; do not split writes across multiple commits or assume partial updates are recoverable.

**Why:** Emerged from debugging two staging failures this week; protects against silent clobbering and race conditions in context state.

**How to apply:** When modifying `context/`, ensure all related changes commit atomically. Validate no partial writes are left incomplete.
