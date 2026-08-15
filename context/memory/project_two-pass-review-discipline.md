---
id: P-GJ9MU9DQ
type: project
title: Two-Pass Review Discipline
created_at: 2026-07-01T10:52:32Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4e54ae4e7207b0f741e65c04b5132893886b184a143677fb3f9848a2a82dc73a
related: [task-159-multi-stage-verification-gate, two-pass-review-catches-concurrency-bugs, sonarcloud-as-security-gate-for-redos-detection]
---

The project uses two-pass reviews: self-review followed by skill-review. In Tasks 182+183, skill-review caught an issue (I1: local tier becomes searchable) that self-review missed. The finding was accepted and tested.

**Why:** Skill-review provides a second perspective that catches issues the author's self-review misses. The discipline consistently adds value.

**How to apply:** After self-review, always run skill-review. Don't skip it. Resolve issues it catches (accept + test or revise).
