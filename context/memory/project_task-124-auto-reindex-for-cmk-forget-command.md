---
id: P-VNH3PTEL
type: project
title: Task 124 — Auto-Reindex for cmk forget Command
created_at: 2026-06-10T20:08:52Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f67a392c3c3f23ae84e218e8b747baeaff399a1b
related: [test-anti-pattern-setup-commands-masking-automation, cmk-version-bumping-convention]
---

Task 124 shipped auto-reindexing of `INDEX.md` when using `cmk forget`. Validated during v0.3.0 memory curation: three `cmk forget` calls left INDEX.md current with no manual reindex step.

**Why:** Eliminates manual bookkeeping in memory management workflows; reduces error surface.

**How to apply:** When curating memory (e.g., release process), use `cmk forget` freely — INDEX.md auto-updates. No reindex step needed.
