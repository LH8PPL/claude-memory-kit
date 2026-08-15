---
id: P-KEHEJaPH
aliases: [P-KEHEJaPH]
type: project
shape: Timeless
title: Disable Viewer During Stress Test Gates
created_at: 2026-08-05T21:00:59Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 1e5111297cab3cbb64a1fd94fe36d320a1820a1845aa080b92c81911153d02ec
related: [stress-gate-release-workflow, two-pass-pr-discipline, 5-concurrency-stress-gate-as-pre-pr-verification]
---

Resource contention between the viewer (port 8799) and concurrent stress tests causes timeouts and invalidates results. Solution: stop viewer before stress run starts, resume only after stress completes.

**Why:** Repeated pattern observed multiple times; resource competition has invalidated stress runs in this project

**How to apply:** Add viewer shutdown as pre-stress gate step. Sequence: stop viewer → stress ×5 → screenshots → resume viewer (if needed). Prevents CPU/memory saturation conflicts.
