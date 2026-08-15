---
id: P-FFYT6GaV
type: project
shape: State
title: Task-Boundary Memory Flush Rule
created_at: 2026-07-12T18:02:42Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: f0841ce1639cc287e3d105a0e069d476c3b50fd9e1f97d30220d65376a057bef
related: [dogfood-decisions-md-committed-post-merge-not-with-feature-p, claude-md-checkpoint-4-pre-commit-screening-rule, dogfood-memory-architecture-session-recall-vs-authoritative]
---

This project applies a "task-boundary flush rule" — dogfood memory accumulated in `context/MEMORY.md`, `INDEX.md`, and `queues/review.md` during long sessions should be committed at natural stopping points (task boundaries), keeping git state synchronized with in-repo memory.

**Why:** Without periodic flushing, memory drifts from git, breaking continuity for future sessions. This project self-dogfoods its own memory system.

**How to apply:** At task boundaries, screen for uncommitted memory in those three files and commit per this rule, or defer the decision to the next session.
