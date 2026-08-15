---
id: P-C6YZVTNX
type: project
title: Dogfood Memory Architecture — Session Recall vs. Authoritative Docs
created_at: 2026-06-23T20:03:59Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 4476d4910131b45199a33ee335493b554595fc6078f83a0008ad6eb65e2b7c43
related: [memory-review-discipline-before-commit, task-boundary-memory-flush-rule, sensitive-content-policy-for-memory-capture-system]
---

The kit maintains two parallel documentation layers:
- **Authoritative** (committed): DECISION-LOG, tasks.md, CHANGELOG — source of truth, always committed
- **Session recall** (uncommitted by design): context/ memory files — useful for next-session bootstrap, but optional commits

The **never-auto-commit-memory rule** means session memory is never auto-committed; commits are decided manually based on whether session findings merit preservation for next-session recall.

**Why:** This separation avoids polluting the authoritative record with session scaffolding while preserving the option to capture valuable session context. Manual commits keep signal-to-noise ratio high in the repo.

**How to apply:** When ending a session, review context/ memory files — commit if next session would benefit from auto-injected session findings; otherwise leave uncommitted. Authoritative docs (DECISION-LOG, tasks.md, CHANGELOG) are the primary record and always committed.
