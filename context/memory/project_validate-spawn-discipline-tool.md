---
id: P-BD25A9HL
type: project
shape: Timeless
title: validate-spawn-discipline Tool
created_at: 2026-07-03T13:25:09Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 6e385937600e78642569e5271b4bf33520eb05ae0beb9503833d8207031c6977
related: [stress-gate-requirement-for-spawn-boundary-changes, vitest-pool-corruption-transient-load-failures, stress-gate-process-for-pr-merge]
---

Runs on `npm test`. Structurally enumerates every spawn site in the kit (child_process, execa, etc.). Prevents unreviewed new spawns from appearing.

**Why:** Acts as a gate for spawn-related security findings. When a suppression is scoped to reviewed sites, `validate-spawn-discipline` ensures no new spawns bypass review.

**How to apply:** On spawn-related Sonar findings, run `npm test`. Pass = no new spawns appeared; Fail = new spawn present, needs review before merge.
