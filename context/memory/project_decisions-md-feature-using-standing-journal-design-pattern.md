---
id: P-N5YK2T6R
type: project
title: decisions.md feature using standing-journal design pattern
created_at: 2026-06-12T12:43:49Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 570f3f0296b54d7c9ffb0b2d38624e321331327f
related: [decision-trail-rule-preserve-decision-history-in-task-entrie, task-147-design-upgraded-the-kit-gets-a-standing-committed-c, idiomatic-timeout-composition-pattern-50s-120s]
---

decisions.md is the next planned feature for the kit (Task 147). Uses standing-journal design to capture both *what* is decided and *why* (not just final state). Manual implementation has existed since May 2026; Task 147 will systematize it into the kit.

**Why:** Kit needs structured decision capture to preserve design rationale across sessions and prevent decisions from being forgotten

**How to apply:** Task 147 should implement decisions.md as a standing journal, ensuring future sessions inherit decision context (*why*, not just *what*)
