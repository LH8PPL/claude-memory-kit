---
id: P-D2NC3KF2
type: project
title: Memory Learn-Loop as Converged System
created_at: 2026-07-01T13:59:21Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ed489a2a5da2e5eb8040f3768e407889cc9bf2801db3345a754c0c99ba3ff2b4
related: [u-mem-describes-one-unified-loop-not-nine-separate-features, ide-to-autonomous-spectrum-same-loop-richer-signals, two-host-kit-architecture-proposed]
---

The claude-memory-kit is converging toward a "memory learn-loop" system. Its organs are:
- **Acquire**: auto-extract (Task 23, shipped)
- **Retrieve**: search + inject (shipped)
- **Curate**: re-curation (Task 95)
- **Measure/Feedback**: learn-loop signal (Tasks 179/180, 55, 181, 189)

Five separate tasks filed over months, each independently reaching toward the same system. Not 9 unrelated line-items—one architectural system with the feedback signal missing (the organ that closes the loop).

**Why:** The backlog converged here organically; U-Mem paper named it, validating what the kit was already discovering. Framing it as one system reframes Task 185 sweep: these five tasks are a cluster (build order? dependencies?) not independent line-items.

**How to apply:** Tasks 55/95/179/180/189 are organs of the learn-loop. Record the system-level stance in an ADR (not 9 separate filings). Future decisions on curation, feedback signals, and trust belong in this frame.
