---
id: P-6VTN4QSS
type: project
title: Windows npm Uninstall – better_sqlite3.node Lock
created_at: 2026-06-16T09:06:10Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f29d219626c0bf151efba0c76d48b93115701736762848a09a3d3a059d5601e9
related: [windows-npm-uninstall-eperm-with-better-sqlite3, windows-npm-uninstall-eperm-on-better-sqlite3-is-benign, windows-dll-lock-blocks-npm-reinstall-better-sqlite3-node]
---

On Windows, `npm uninstall` may report EPERM (permission denied) when attempting to remove `better_sqlite3.node` — the DLL is locked by a process or OS lock. However:
- The package removal still succeeds overall ("removed 136 packages")
- Only a cosmetic temp directory is left behind
- This is a known Windows quirk; not a data loss or functional problem

Keeping better_sqlite3 is intentional despite this quirk (it has better perf than node:sqlite alternatives).

**Why:** Helps distinguish a non-blocker (EPERM on .node) from actual failures during uninstall/install cycles.

**How to apply:** Ignore EPERM on better_sqlite3.node during npm uninstall. The package is still removed. Clean up the temp dir manually if needed, but it's not critical.
