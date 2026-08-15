---
id: P-DY6aUA7A
type: project
title: Task-Lane Consistency Audit Workflow
created_at: 2026-06-15T07:17:13Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 3c235faa2af9db9e862837555cc20dac20e37d0b3b083744e57dd3019b6b5041
related: [release-plan-md-authoritative-task-to-lane-map, version-snapshot-in-recent-md-guards-against-cross-session-a, zero-loss-archive-verification-method]
---

Procedure to audit whether all tasks with lane tags are properly assigned in RELEASE-PLAN.md:
1. List all tasks in tasks.md with lane tags
2. Check each one against RELEASE-PLAN.md
3. Identify orphans (laned in tasks.md but missing from RELEASE-PLAN.md)
4. Add orphans to RELEASE-PLAN.md in the correct lane
5. Verify all open tasks are now in RELEASE-PLAN.md
6. Run validators (references, numbering-gaps) to confirm consistency

**Why:** Tasks can acquire lane context without being formally assigned to a version, creating shadow state. A side-by-side comparison of both files catches these silently-laned-but-unassigned tasks.

**How to apply:** After adding multiple laned tasks, run this workflow. This session revealed and fixed 4 silent orphans. Compare both files, fix RELEASE-PLAN.md (the authoritative source), then run validators. Repeat whenever you suspect new lanes have been added without RELEASE-PLAN assignments.
