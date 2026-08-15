---
id: P-QX2GMNQA
type: project
shape: Timeless
title: Scoped Threat-Pattern Library Design
created_at: 2026-07-07T20:16:58Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 513a4383addacebde8d876b9027cab783977cdfa389cee76eaa76826f5c5d0cb
related: [task-boundary-memory-flush-rule]
---

Shared threat-pattern library with three scoped subsets (all/context/strict), each with false-positive tolerance tuned to its detection boundary. Patterns called from three lifecycle points.

**Why:** Reference pattern for organizing threat detection across multiple boundaries; shows how to reuse patterns with scope-specific tuning

**How to apply:** Consider adopting multi-scope pattern library in the kit's threat/PII detection design to reduce false positives at different lifecycle points
