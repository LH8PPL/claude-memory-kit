---
id: P-GKBBMWDZ
type: project
shape: State
title: Core-Memory-Kit Installed with Claude Code Hooks
created_at: 2026-07-15T13:55:24Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 61101d7bc842839378e0156a6b6e08df77972cd1607e2a585c32906c30048196
related: [rebuilding-the-global-cmk-binary-after-code-changes, close-claude-code-before-global-cmk-install-to-avoid-ebusy, gate-check-g0-cli-version-verification]
---

Core-memory-kit is installed in this project with event hooks wired to Claude Code. Post-update sanity check: run `cmk doctor` and verify HC-1 (hooks registered) and HC-11 (backend CLI present) pass.

**Why:** Kit functionality depends on Claude Code version; after tool updates, hooks may break if versions diverge.

**How to apply:** After updating Claude Code or the kit, immediately run `cmk doctor` to confirm HC-1 and HC-11 are green. Troubleshoot before resuming work if checks fail.
