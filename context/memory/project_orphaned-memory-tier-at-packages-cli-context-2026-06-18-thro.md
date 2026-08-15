---
id: P-5PK5NMX5
type: project
shape: State
title: Orphaned memory tier at packages/cli/context/ (2026-06-18 through 2026-07-12)
created_at: 2026-07-21T15:08:42Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0f76af3248e00892dc62d09d06c017e7945f597829f655f6af888d1af5984360
related: [capture-hook-bins-create-orphaned-memory-tiers-due-to-missin, bash-cwd-drift-creates-packages-cli-context-artifacts, new-v0-6-2-guard-candidate-undefended-cwd-as-root-assumption]
---

Location: `packages/cli/context/`

Contents:
- 6 fact files
- 1 review-queue entry
- Extract logs and transcripts through 2026-07-12
- None of these 7 items exist in root `context/` tier

Root `now.md` shows a gap (14:20 → 14:59) covering the entire Task-241 window, indicating facts were written to this orphaned tier.

Path is gitignored (`.gitignore:111`, added 2026-06-13) — no privacy exposure but demonstrates the design bug.

**Why:** Capture-hook bins default `projectRoot: process.cwd()` without root-discovery walk, creating tiers in any subdirectory they're invoked from.

**How to apply:** Recover the 7 facts into root tier during v0.6.2 remediation. Preserve the stray tier as evidence during investigation; do not delete.
