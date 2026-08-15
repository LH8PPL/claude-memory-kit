---
id: P-XTMaJDH4
type: project
shape: State
title: Stress-flake root cause — hook-timeout config gap
created_at: 2026-07-28T08:06:37Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 863833e805addcbede9b9a163e43078bce426f3818943a1b7ae8cd26413df714
related: [codeql-and-sonarcloud-only-report-on-remote-prs, cmk-hook-capture-fails-during-stress-gate, canonical-registry-for-persona-search]
---

The months-long stress-flake on the hook surface was caused by a hook-timeout configuration gap, not infrastructure flakiness. D-406 named this issue. After implementing the self-detecting pattern registry fix, clean 5/5 runs confirmed resolution.

**Why:** Prevents wasted debugging cycles; identifies config rather than infrastructure as the culprit for intermittent hook failures.

**How to apply:** When hook tests flake intermittently, investigate hook-timeout config first. Use self-detecting pattern registry as the corrective structural pattern.
