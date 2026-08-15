---
id: P-2RHLEEPM
type: project
shape: State
title: Health Whisper — Structural Dependency Limit
created_at: 2026-08-01T12:55:44Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 76b3770cbed47a5f1b76f2d279218d7804d28ccf0ed18a2158cfabeddf55ed5b
related: [tombstone-auto-recall-design-decision]
---

- The whisper rides the UserPromptSubmit hook; total hook layer death is structurally unreachable
- Partial failures (one hook broken, others alive) ARE covered — common case
- Structural fallbacks independent of hooks: cmk install auto-recovery, doctor, MCP server

**Why:** Important to document this limit; sets expectations and identifies where alternative coverage lives

**How to apply:** When designing health alerting, assume whisper covers partial hook failures only; rely on cmk install/doctor/MCP for total hook death
