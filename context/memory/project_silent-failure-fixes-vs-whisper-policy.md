---
id: P-LST9P25P
type: project
shape: State
title: Silent Failure Fixes vs Whisper Policy
created_at: 2026-08-01T12:41:50Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 98ac4a01d13a768d3fc381a965e731209e1742ea7cfa4fc076f337a5bc568e70
related: [q1-refined-auto-fix-vs-whisper-boundary-cmk-doctor, auto-extract-reliability-pattern, troubleshooting-skill-architecture-shape-b-confirmed]
---

The kit uses two failure-handling strategies:
  - **Silent fixes** (kit-owned, reversible, self-verifying): stale locks, index drift; verified by next run's success
  - **Whisper** (everything else): environmental/consequential failures (missing CLI, broken hooks, API errors) and unknown types

**Why:** Users won't run `cmk doctor` themselves, so the kit must notify the model. Environmental failures have outside-system implications requiring judgment.

**How to apply:** For each failure class, check if kit-owned AND reversible AND self-verifiable. If yes, fix silently; otherwise whisper.
