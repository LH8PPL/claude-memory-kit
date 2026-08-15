---
id: P-9JF76SN7
type: project
shape: Timeless
title: Cursor Hook Probes Auto-Reload Without Restart
created_at: 2026-07-09T17:40:45Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: d7169c96ea9ff749a72487300832e3670594045cf0d4c90a9e1826c4316ee6a9
related: [hook-binary-spawned-fresh-each-turn]
---

Cursor invokes the probe script fresh each turn via `cmd.exe /c node ...probe.mjs`, so edits to the probe file take effect immediately without restarting Cursor.

**Why:** Enables rapid iteration when debugging hook probes — no need to close/reopen the editor between test turns.

**How to apply:** When modifying probe scripts for debugging, send another turn in Cursor to see the updated output; do not restart.
