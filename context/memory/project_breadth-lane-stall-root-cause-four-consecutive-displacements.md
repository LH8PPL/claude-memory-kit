---
id: P-QFa7MTRG
type: project
title: Breadth Lane Stall Root Cause (Four Consecutive Displacements)
created_at: 2026-07-02T07:43:30Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: b1355fb31c4bfce950432c82b75503947556ddc5f575c6336605273e9556bfdf
related: [kit-s-haiku-backend-has-undeclared-claude-cli-dependency, kit-versioning-uses-lane-themed-releases-not-strict-semver, v0-3-5-patch-vs-v0-4-0-versioning-logic]
---

The v0.4.x breadth lane (one agent per patch) stalled after Kiro (v0.4.0), when Cursor was displaced by:
- v0.4.1: Task 167 (now.md-roll bug)
- v0.4.2: security patch 173
- v0.4.3: Task 151 (persona layer injection hole)
- v0.4.4: Task 66 (temporal) + riders

Each displacement was justified individually. Cumulatively, the lane never re-committed after the first one; it drifted forward four times.

**Why:** Understanding this as death-by-a-thousand-cuts (not a single bad decision) helps design a re-decision that sticks by accounting for how priorities actually shift, not assuming they won't.

**How to apply:** At v0.4.4 cut, when choosing among the three options, document the re-commitment explicitly so the next displacement is visibly a choice, not a drift.
