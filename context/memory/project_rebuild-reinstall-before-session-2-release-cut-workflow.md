---
id: P-H33RCKS4
type: project
title: Rebuild+Reinstall Before Session 2 (Release Cut Workflow)
created_at: 2026-06-16T11:59:02Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 542a27860e81bea869bfa8d1909ee2db56e70089c113ecf5bc5d2e4bc93df67a
related: [artifact-rebuild-for-v0-4-0, rebuilding-the-global-cmk-binary-after-code-changes, testing-workflow-for-claude-memory-kit-fixes]
---

Before starting Session 2 (recall verification), rebuild and reinstall the fixed 0.3.2 package. The cut-gate14 session is running stale pre-fix code with an outdated MCP server.

**Sequence:**
1. Close Claude Code on cut-gate14 (releases locked DLL)
2. `cd C:\Projects\claude-memory-kit\packages\cli && npm pack`
3. `npm uninstall -g @lh8ppl/claude-memory-kit`
4. `npm install -g .\lh8ppl-claude-memory-kit-0.3.2.tgz`
5. `cmk --version` (confirm 0.3.2) and `cmk doctor`
6. Reopen Claude Code on cut-gate14
7. Start Session 2

**Why:** Session 2 tests recall via `mk_search` (MCP server). Stale server = stale code = re-hitting fixed bugs. The release-cut chain is: fix → save → verify-on-current-code.

**Tradeoff:** Rebuilding closes the window, so you exercise SessionEnd roll path instead of SessionStart new-chat-same-window. Both valid per D6; priority is testing recall on current code.

**How to apply:** Execute before Session 2. Confirm `cmk --version` and `cmk doctor` before proceeding.
