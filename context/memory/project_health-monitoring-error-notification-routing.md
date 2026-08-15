---
id: P-ZJCLFRC7
type: project
shape: State
title: Health Monitoring — Error Notification Routing
created_at: 2026-08-01T12:55:44Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: cb0a4c1093c49f75e6d50470bc0eb58b538b7d7d8790e2fb05cafb39bbcb6143
related: [memory-capture-status-emitted-at-session-start]
---

- All error signals sent to model via `additionalContext` ("whisper")
- Visible `systemMessage` line output ONLY when `severity: memory-off` (memory capture is offline)
- Rationale: visible errors during breakage are overly naggy; real issues surface through model-to-conversation; visibility only when memory itself is unavailable

**Why:** User approved this design; reflects preference against session-time nagging while ensuring critical awareness

**How to apply:** Implement health monitoring to route all failures to model via `additionalContext`; reserve `systemMessage` for `memory-off` severity only
