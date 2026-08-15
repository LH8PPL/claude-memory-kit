---
id: P-YAQT3ER9
type: project
title: D-177 Self-Defeating Loop in Persona Graduation
created_at: 2026-06-29T13:08:49Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 1d27fc4d937277e934abf56b3824f51058c59a6b89da0281a92c6f5554bb309d
related: [four-move-redesign-for-d-177-persona-graduation-loop, v0-4-5-roadmap-task-196-cursor-adapter-task-198-temporal-swe]
---

When personas overflow the 1800B cap during promotion, they're evicted to `fragments/` directory. However, `fragments/` isn't injected at cold-open, so personas silently disappear from the next session. Task 151 (v0.4.3) will fix this via recurrence-scoring to replace the form-based confidence gate.

**Why:** Known degradation causing personas to vanish; core problem Task 151 redesign addresses

**How to apply:** When implementing Task 151, ensure the promotion-graduation-injection chain stays intact and graduating personas remain accessible
