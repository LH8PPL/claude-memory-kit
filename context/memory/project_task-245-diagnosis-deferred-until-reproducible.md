---
id: P-VVZPFZ6R
type: project
shape: State
title: Task 245 Diagnosis Deferred Until Reproducible
created_at: 2026-07-21T14:30:27Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a658c179a669173785dcada12c5b7b921eaa1743a3a8943aa0c47e5fed6b3b89
related: [notification-doctrine-non-actionable-repeating-failures, supply-chain-watch-issue-filing-fixed-task-237, 356-dispatch-agent-killed-fix-batch-does-not-auto-start]
---

Task 245 (npm silent-install) has no diagnosed cause intentionally. Reproduce the issue with full output captured first. If the issue cannot be reproduced cleanly, close the task — that is a correct, desired outcome, not a failure. Do not design a fix until reproduction is reliably repeatable.

**Why:** Avoids designing fixes to non-existent problems; ensures effort is spent on real issues.

**How to apply:** When resuming Task 245, run reproduction steps with full output logging first. A clean non-repro closes the task correctly.
