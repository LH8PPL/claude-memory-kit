---
id: P-aUNXXaRE
type: project
title: Release Cut Sequencing and Prerequisites (v0.4.4 Pattern)
created_at: 2026-07-02T18:55:08Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: aa7d668d0d0f48a68ee2b227d2c7cd633dd70d35193e3ab5ae6020badd71266e
related: [release-workflow-full-sequence-for-v0-4-3-and-future-cuts, v0-4-1-release-gate-workflow, tool-quirk-cmk-pack-uses-committed-tree-version]
---

Release cut workflow for v0.4.4 requires strict sequencing with preconditions:

**Prerequisites (before step 0a):**
1. Commit + push the cut-gate doc (direct to main; watch CI green per standing rule)

**Step sequence:**
1. Sync main: `git checkout main; git pull` (picks up release commit + doc commit)
2. Verify version: Confirm `0.4.4` in package.json (guard; set by release commit, e.g., 209e2aa)
3. Run 0b (tarball build): `npm pack` → uninstall global → install fresh tarball → `cmk --version` (must show 0.4.4)

**Guard:** Do NOT re-run `npm run release` if release commit is already on main.

**Why:** Prevents accidental double-release. Version info must be committed before pack. Doc must be pushed before sync. Guards (version check, cmk --version) verify correctness.

**How to apply:** For future cuts, verify release commit exists on main before running 0a/0b. Commit docs first, then sync. Always verify final version with `cmk --version`.
