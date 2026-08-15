---
id: P-A396Z6JP
type: project
title: Windows DLL Lock Blocks NPM Reinstall (better_sqlite3.node)
created_at: 2026-06-16T11:59:02Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 3d7d2ab412fb476b5410378c1fcdcefd12be3e00995fc3c19d3edb9f55974a80
related: [npm-uninstall-ebusy-error-with-better-sqlite3-node-on-rebuil, npm-uninstall-eperm-error-with-sqlite-vec-dll-on-windows, close-claude-code-before-global-cmk-install-to-avoid-ebusy]
---

When reinstalling `@lh8ppl/claude-memory-kit` via `npm uninstall -g`, if Claude Code is running, the OS file lock on `better_sqlite3.node` (native SQLite binding) prevents deletion/replacement. The uninstall fails or hangs.

**Why:** The Node.js native module loads the DLL into the process; the file stays locked until the process exits.

**How to apply:** Close Claude Code (or any process that loaded the module) before running `npm uninstall -g`. This releases the file lock. After uninstall succeeds, reopen to load the fresh DLL from the reinstalled package.
