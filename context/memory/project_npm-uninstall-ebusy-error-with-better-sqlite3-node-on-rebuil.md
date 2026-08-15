---
id: P-7aNNUU4Z
type: project
title: npm uninstall EBUSY Error with better_sqlite3.node on Rebuild
created_at: 2026-06-21T16:09:53Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: c72b74d59c6f0049908ba38eec7f8df9a3526ef1459b7762347b53c8c501bc92
related: [windows-dll-lock-blocks-npm-reinstall-better-sqlite3-node, close-claude-code-before-global-cmk-install-to-avoid-ebusy, npm-uninstall-eperm-error-with-sqlite-vec-dll-on-windows]
---

When running `npm uninstall -g @lh8ppl/claude-memory-kit`, the command can fail with EBUSY (resource busy) on the file `better_sqlite3.node` in node_modules. Root cause: `cmk mcp serve` (or other running Claude Code sessions) hold the binary module lock.

Example error:
```
npm error errno -4082
npm error EBUSY: resource busy or locked, copyfile ... better_sqlite3.node
```

Despite the error, the npm pack step succeeds and the rebuilt package is usable.

**Why:** This is a recurring papercut during rebuilds on Windows; users will hit it unpredictably depending on what's running in their session.

**How to apply:** Document in the rebuild guide that users should close any running `cmk mcp serve` processes and Claude Code editor sessions before uninstalling, to avoid the lock. If the error occurs, it's harmless — the install can still proceed, but closing those processes first is the cleaner path.
