---
id: P-LXNVRGL5
aliases: [P-LXNVRGL5]
type: project
shape: State
title: Sequential Gate Execution Required; First-Invocation Gate Cannot Run in Parallel
created_at: 2026-08-13T10:58:15Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c23b9efa27511c6871c46f1977feae9f28ff61d1959e4b8953a002b5efd4c1e5
related: [gate-verification-system-architecture, 5-concurrency-stress-gate-as-pre-pr-verification, stress-test-gating-rule-for-pr-approval]
---

Test gates must execute sequentially, never concurrently. The 5/5-first-invocation gate is particularly sensitive and cannot run while other gates are active — parallel execution causes test state contamination and failures.

**Workaround**: Deliberately hold/delay branches after each merge to ensure only one gate runs at a time. This prevents concurrent execution and contamination.

**Why:** Repeated painful experience (this lesson has been "paid for three times" in the current version cycle) established that concurrent gate execution breaks test reliability. It's a hard constraint discovered through failures.

**How to apply:** When scheduling work (merges, branch holds, gate runs), enforce sequential execution. Hold branches explicitly between gate cycles to prevent concurrent execution, especially on first-invocation gates.
