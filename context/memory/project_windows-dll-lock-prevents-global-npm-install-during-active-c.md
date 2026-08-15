---
id: P-6EM9G3GA
type: project
title: Windows DLL Lock Prevents Global npm Install During Active Claude Code
created_at: 2026-06-18T08:38:40Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 3af9ebf6155da922db86349db2014649ed1e0505e9bd3522715cce8ee975db5b
related: [close-claude-code-before-global-cmk-install-to-avoid-ebusy, windows-ebusy-when-updating-cmk-during-claude-code-runtime, npm-uninstall-ebusy-error-with-better-sqlite3-node-on-rebuil]
---

During an active Claude Code session, `npm install -g` for claude-memory-kit can fail with EBUSY on `vec0.dll`. Root cause: Claude Code + MCP server child processes hold open handles to the DLL, preventing npm from replacing files in the global install directory.

Workaround: Close Claude Code → run install in a plain terminal → reopen Claude Code. Known incident: D-80.

**Why:** npm requires exclusive file access during install. Lingering process handles to DLLs can prevent file replacement. Forcing the install or killing processes manually risks the exact breakage this project's testing practices are designed to catch.

**How to apply:** If global install fails with EBUSY/permission errors, close Claude Code entirely, then run the install in a plain terminal. Reopen Claude Code after the install succeeds (it will pick up the new MCP server). Do not force-kill processes or use --no-verify.
