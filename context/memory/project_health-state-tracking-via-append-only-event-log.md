---
id: P-GMZARVVZ
type: project
shape: State
title: Health State Tracking via Append-Only Event Log
created_at: 2026-08-01T12:51:44Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: b8ba0087762c527806867883130c1878383827a13f618aaa791728c29bbe447d
related: [health-log-system-architecture-ratified]
---

- Health state uses append-only `health.log` (NDJSON format, same discipline as `audit.log`).
- Both success and failure outcomes logged: `{class, outcome: ok|fail, ts}`.
- No mutable state files (avoids read-modify-write hazards prohibited by ADR-0002).
- Hot-path check tail-reads recent log entries to compute per-class failure streaks.
- Event-driven: failures recorded only when real operations hit them.

**Why:** Append-only log is race-condition-free under concurrent writers; avoids mutable state hazards; provides audit trail; O(1) hot-path check latency on tail-reads.

**How to apply:** Whisper health check (buildMemoryHint hot path) reads tail of health.log; doctor command is fallback for unknown codes.
