---
id: P-GWKDXJU4
type: project
title: Planning Docs as Standalone Commits on Main
created_at: 2026-06-15T12:11:13Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: baaa59f50de54f37c90bc202296f4bfcd615af276662a5f586d4d8250ee49150
related: [dogfood-decisions-md-committed-post-merge-not-with-feature-p, release-plan-md-authoritative-task-to-lane-map, work-items-require-task-entry-before-implementation]
---

Planning documents (tasks.md, RELEASE-PLAN.md, memory syncs) that span a release are committed to main **first, as standalone docs-only commits**, separate from feature/task implementation branches.

**Why:** Maintains "single source of truth, same commit batch" discipline. Scope decisions are visible in main history and don't get tangled with task PR reviews.

**How to apply:** Before branching for individual tasks, commit planning docs to main. Each task branch starts clean from main after planning docs merge.
