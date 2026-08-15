---
id: P-X362NWKX
type: project
title: Compaction-State Module — v0.4.1 Core Architecture Refactoring
created_at: 2026-06-25T14:17:33Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 39341b7d3f237dc5854fa3084e55e49c8417007ebad7b7d9f6db296ce93a3d39
related: [architecture-review-priorities-and-the-persona-routing-into, task-167-compaction-state-module-interface-two-methods-rich, v0-4-6-release-roadmap]
---

Architecture review recommends extracting a Compaction-State module (Candidate 1, highest strength). Currently "did compaction succeed recently?" is scattered across presence sentinel, mtime marker (read/written by 5 callers), and per-date logs with no single owner.

Extracting this module directly solves the compaction/cron bug class AND implements Task 167.A, 167.D, 167.F as callers. The v0.4.1 bug-fix and architecture improvement are the same work.

**Why:** Scattered state-ownership is the root cause of the bug. Architecture review and bug analysis converged on the same solution.

**How to apply:** Design Compaction-State's interface first (last-success query/update), then refactor all callers to use it. Unifies logic and fixes bug class in one sweep.
