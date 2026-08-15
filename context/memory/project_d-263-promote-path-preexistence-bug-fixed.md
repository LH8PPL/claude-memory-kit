---
id: P-K3aSP9Za
type: project
shape: Event
title: 'D-263: Promote Path Preexistence Bug (Fixed)'
created_at: 2026-07-03T05:54:40Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c66fb53a8636fbd9e4c8db2ea967a214aec1e272d3115d67a50ef3450f2bbcff
related: [b3-b4-wedge-test-workflow-cross-project-doctrine-capture-val, config-directory-migration-is-critical-blocker-for-rename, d-303-fixed-kiro-auto-extract-user-prompt-empty-recovered-fr]
---

- **Bug**: promote path required `~/.claude-memory-kit/` to pre-exist before first use → new users' first cross-project rule silently dropped (silent data loss, no error)
- **Root cause**: Two code paths (bins) did not unconditionally pass `userDir` to promote function; promote function did not scaffold the directory on first write
- **Fix**: (1) Both bins now pass `userDir` unconditionally; (2) Shared promote function scaffolds `~/.claude-memory-kit/` on first gated promote
- **Verification**: TDD (red → fix → green); 2 stale tests corrected to new contract; full suite 2573/0 pass; true-from-empty live-verified on real bin; stress gate 5× pending

**Why:** First-time users (new install) would silently lose their first cross-project rule capture. Fix ensures bootstrap path is scaffolded at first write. Critical for zero-config adoption.

**How to apply:** When working on promote/cross-project rules in future, assume this bug is FIXED. If new installs fail to capture rules, check that bins unconditionally pass `userDir` and promote function signature is correct.
