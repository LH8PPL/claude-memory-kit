---
id: P-VVNJ2LF6
type: project
shape: Timeless
title: Hook Binary Spawned Fresh Each Turn
created_at: 2026-07-03T11:16:11Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0614b0e128018a60b44ef94ae19da5b624693833337050f7a78a4c1a47c35534
related: [cursor-hook-probes-auto-reload-without-restart, two-pass-fix-discipline, close-vs-code-to-close-claude-code-on-cut-gate14]
---

The hook subprocess is instantiated on each turn and does not persist across turns. Fixes to hook code become active immediately without requiring session restart.

**Why:** Enables rapid iteration on hook fixes; fixes are live in the same session window

**How to apply:** Test hook bug fixes inline without restarting; fixes become active on the next turn
