---
id: P-4LM6ZATU
type: project
title: v0.4.4 and v0.5.0 Build Phases
created_at: 2026-07-02T06:15:32Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 24cedb443629a8090e46a7fc9e04d3e29c15afdf563a41a7103d22285261cce0
related: [release-roadmap-v0-5-1-v0-5-4, v0-4-4-build-order, release-version-queue-d-309]
---

Tasks are organized in `specs/tasks.md` by phase:
  - **v0.4.4** (temporal minor): 66 (temporal validity), 150 (AI-judged commit flow)
  - **v0.5.0 Phase 1a–1d** (learn-loop, build order): 190 (recall-log first) → 193 → 191 → 192
  - **v0.5.0 Phase 2**: 194 (closes the edge); riders 95, 96 follow Phase 1 completion

**Why:** v0.5.0 is the major release carrying the adopted learn-loop design (ADR-0017). The phase sequence reflects inter-dependencies (190's recall-log data feeds 189; 191's judgment files unblock 180).

**How to apply:** Use the phase sequence as the build order. When starting v0.5.0, begin with 190; confirm 193 is ready before starting; check that 191 and 192 prerequisites are met before Phase 2.
