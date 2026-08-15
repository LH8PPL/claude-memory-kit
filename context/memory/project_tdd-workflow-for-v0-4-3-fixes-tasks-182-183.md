---
id: P-XFN5Q73F
type: project
title: TDD Workflow for v0.4.3 Fixes (Tasks 182, 183)
created_at: 2026-07-01T09:00:22Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: bc3c5f5c007c9fb7e781e4fe8124ee7e1f43407b19ca475d4b6f3c158da4d725
related: [v0-3-1-release-final-workflow, deciding-experiment-that-gates-v0-3-1, v0-5-0-release-workflow-stress-commit-push-pr-merge-repack-g]
---

- Branch `fix-182-183-persona-search` off main
- **Task 182 (load-bearing: persona not searchable):**
  - Write failing test: promote fact → `cmk search` → assert `U-…` hit
  - Red → add 3 persona files to `listObservationSources` → green
  - Two-pass review
- **Task 183 (cosmetic: example-bullet pollution):**
  - Write failing test: fresh install → `cmk search` → no `(example)` bullet  
  - Red → skip sentinel-dated seeds at index → green
  - Two-pass review
- Run stress tests (5/5)
- Re-run cold-open live to validate
- Fold changes into v0.4.3 CHANGELOG; tag release

**Why:** Small, verified fixes for core-promise gaps before shipping. Task 182 is load-bearing (persona search broken); 183 is cosmetic. Both high-confidence, low-risk changes.

**How to apply:** Use this sequence for v0.4.3. Build 182 first (more critical). Code locations: `listObservationSources` (add persona files), index logic (seed-skip for 183).
