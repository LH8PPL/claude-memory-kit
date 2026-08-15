---
id: P-3EVDAURQ
type: project
shape: State
title: 'URGENT RESUME: the GLOBAL cmk is HALF-INSTALLED/BROKEN (ERR_MODULE_NOT_FOUND) -'
created_at: 2026-07-07T12:35:49Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: 680809a58cb723ef3eef3b0aad348e2966a04117189abdb9b0d05d90ab8688a8
related: [release-gate-cut-gate-guide-must-pass-before-tagging, v0-4-0-local-installation-workflow, kg-guard-retest-failed-was-stale-artifact-not-fix]
---

URGENT RESUME: the GLOBAL cmk is HALF-INSTALLED/BROKEN (ERR_MODULE_NOT_FOUND) - the 0.5.0 tarball install hit EBUSY on better_sqlite3.node (this session's own cmk mcp serve held the DLL). FIX FIRST, new session: (1) close all Claude/kiro sessions using cmk, (2) npm uninstall -g @lh8ppl/claude-memory-kit, (3) npm install -g C:/Projects/claude-memory-kit/packages/cli/lh8ppl-claude-memory-kit-0.5.0.tgz, (4) cmk --version = 0.5.0 + cmk doctor. THEN the user's call: v0.5.0 tag is ON HOLD until the FULL cut-gate guide (docs/process/cut-gate.md sessions 1-3 + cold-open) runs on 0.5.0 - the user's directive; the Kiro+Cursor guides also never ran for v0.4.5. Dev-repo bins (node packages/cli/bin/cmk.mjs) still work - only the GLOBAL is broken. Release commit 8de88ae + D-291 on main, CI green, NO TAG YET.
