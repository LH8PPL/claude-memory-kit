---
id: P-FXY7PLY5
type: project
title: Two-Pass Review Catches Concurrency Bugs
created_at: 2026-06-26T09:48:37Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 3e4f94f1482c892e62d2693d22203c5f8d23493dbc96cd240b4a2e7fabd707e1
related: [two-pass-review-discipline, task-159-multi-stage-verification-gate]
---

Two-pass review (self-review composition pass + skill-review code pass) caught a dangling-promise bug in the original sync-drain (timeout + `process.exit` stranding the buffer). Single-pass self-review had cleared it.

**Why:** Composition-level thinking (logic flow) and code-level thinking (implementation, cleanup, concurrency) catch different bug classes.

**How to apply:** For async/concurrent code, use two passes: first on composition/flow, second on implementation details (cleanup, resource leaks, edge cases).
