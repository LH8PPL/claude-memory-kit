---
id: P-6Y9UFXB2
type: project
shape: Timeless
title: Section §5.1 Binding Rule — Convergence ≠ Verification
created_at: 2026-07-03T21:05:08Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 3f3f112a8ebf563a9fa49cc03df33459e9d54f38e9cd7b72e87c4acbc4ba1792
related: [task-50-research-revisit-gate-and-multi-agent-pattern, context-snapshot-frozen-at-session-start, stale-replay-guard-partial-coverage-identified]
---

Research findings that converge across multiple projects do not constitute verification of current state. Before implementing code based on prior research, verify critical claims against primary sources.

**Example:** Task 50 documented two projects' Cursor integrations; Task 196 required fresh verification of Cursor's current docs (hooks schema, MCP payloads, rules system) *before* first code edit. This caught the Memories-removal change that the research base missed.

**Why:** Prevents bugs from stale/incomplete secondary sources. Secondary research provides direction; primary sources catch recent changes and edge cases.

**How to apply:** At lane/task start, if it depends on prior research, fetch fresh primary docs/APIs/sources before first code edit. Allow a short verification cycle (1–2 doc fetches, as done for Task 196).
