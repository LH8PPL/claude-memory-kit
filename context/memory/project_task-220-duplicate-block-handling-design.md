---
id: P-GaXCFSTA
type: project
shape: Plan
title: Task 220 Duplicate Block Handling Design
created_at: 2026-07-11T20:53:40Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4b466ac1e3bde4e486f46d099b2209b9a9d6a722d186360a0b41b19514fb65b9
related: [install-agent-mjs-non-global-regex-allows-duplicated-managed, claude-memory-kit-v0-4-3-release-workflow]
---

**Design** (reconnaissance complete, implementation blocked on PR #280):
- Install: fold duplicates into single refreshed block (self-healing per D-169 posture)
- Uninstall: remove ALL blocks
- Preserve user bytes between blocks
- Detect duplicates: surface `duplicateCount` via `findManagedBlock` for HC-9 flagging

**Implementation scope**:
- `claude-md.mjs`: first-match in `findManagedBlock`
- `install-agent.mjs`: non-global `String.replace`

**Sequencing**: Task 220 branches off fresh main only after PR #280 CI passes

**Why:** D-169 self-healing posture; HC-9 needs duplicate visibility; strict sequencing prevents race conditions

**How to apply:** Once PR #280 merges, implement per design spec; do not open Task 220 implementation branch until PR #280 is live
