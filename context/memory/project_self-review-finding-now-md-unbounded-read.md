---
id: P-W6J92CKU
type: project
shape: Event
title: Self-Review Finding — now.md Unbounded Read
created_at: 2026-07-20T16:58:47Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a7415acd8b7ef2fbde2da3474c5df138329ebca05513f7c2f3bcb1e4a6abffa4
related: [weekly-compression-timeout-and-v0-3-4-retry-logic, skill-md-yaml-colon-space-bug, compaction-state-module-v0-4-1-core-architecture-refactoring]
---

Gate was doing unbounded read of now.md on hook's hot path. now.md is the one file with no write-side cap — the very thing Task 235 bounds. Fixed: size-first on reads.

**Why:** Catching issues before they compound; now.md can grow very large (dogfood grew to 410 KB in v0.4.0)

**How to apply:** On future buffer file reads, check size first; apply bounds-aware logic
