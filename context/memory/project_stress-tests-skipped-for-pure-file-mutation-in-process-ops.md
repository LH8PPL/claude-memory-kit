---
id: P-LWBE45ZK
type: project
shape: Absence
title: Stress Tests Skipped for Pure File-Mutation + In-Process Ops
created_at: 2026-07-15T21:15:36Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: cf92cacf989c701038a5fa755678e7f89eae3c8a8a2aec5a0cef66aefc5949d1
related: [stress-testing-omitted-for-pure-read-cli-changes, stress-tests-require-git-isolation-task-150-eperm-race, design-lesson-numbering-system-d-in-claude-memory-kit]
---

When a task involves only file-mutation + in-process doctor checks with no spawn/hook/concurrency surface, stress tests are intentionally skipped. Documented precedent established in Task-214 and Task-220.

**Why:** These operations have no async/timing surface where race conditions could hide; stress testing is not informative.

**How to apply:** When reviewing completed tasks, a skipped-stress-test note with this rationale indicates deliberate choice, not oversight. Consider it acceptable for Task-230 and similar future tasks.
