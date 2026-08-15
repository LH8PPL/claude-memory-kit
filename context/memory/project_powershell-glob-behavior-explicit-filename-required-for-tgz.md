---
id: P-WSCLNW49
type: project
title: 'PowerShell Glob Behavior: Explicit Filename Required for .tgz'
created_at: 2026-06-21T15:01:02Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: ca09ed61c19237608262397afc8880b783b0524a7867853a557a3a71e9c05c8b
related: [npm-glob-expansion-fails-in-powershell-use-explicit-filename, minting-process-failure-self-managed-worktree-workaround, kiro-cli-env-passing-limitation]
---

PowerShell does not glob `*` the way Unix shells do. When passing `.tgz` archive filenames, use explicit filenames instead of wildcard patterns.

**Why:** Real-run gotcha; scripts relying on `*.tgz` glob fail silently on Windows

**How to apply:** In gate/restore docs and scripts, specify `.tgz` filenames explicitly, not as glob patterns
