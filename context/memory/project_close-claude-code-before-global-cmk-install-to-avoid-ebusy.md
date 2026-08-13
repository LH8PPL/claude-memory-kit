---
id: P-WQDKTWEG
type: project
title: Close Claude Code Before Global cmk Install to Avoid EBUSY
created_at: 2026-06-20T11:30:00Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f7afadbd3a62f9986b1b6192b9420d60e5838c5d2f724a9a552faa9c404eca50
related: [windows-dll-lock-prevents-global-npm-install-during-active-c, windows-ebusy-when-updating-cmk-during-claude-code-runtime, npm-uninstall-ebusy-error-with-better-sqlite3-node-on-rebuil]
---

Global install via `npm install -g @lh8ppl/claude-memory-kit` may fail with EBUSY if Claude Code's MCP servers are running.

**Before install:** Close Claude Code fully; verify MCP process count is 0 (via Task Manager or `cmk doctor`).

**If EBUSY occurs:** Kill Claude Code and retry the install.

**Why:** Claude Code's MCP processes hold file locks; npm needs exclusive DLL access during installation. DLL contention occurs on Windows.

**How to apply:** Add to pre-install checklist: close Claude Code → confirm 0 MCP processes → run global install → reopen Claude Code.
