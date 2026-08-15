---
id: P-AV5aYUZJ
type: project
title: Live Cut-Gate Requirement — Unit-Green ≠ Works-on-Real-Input
created_at: 2026-06-19T10:22:15Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: fcea8d29eeba411d68105fe445c22db3f4cddefc901c740b4eb1ca093adbbdc3
related: [cut-gate-testing-practice, manual-verification-gates-for-tasks-74-and-151, full-gate-re-run-on-final-code-after-code-review]
---

The binding verification rule for critical paths is that unit test passage does not guarantee live correctness. Critical tasks (e.g., Task 161 retry logic) require a live cut-gate test against real Haiku before task completion. Task 161.11 (exercise retry on real Haiku end-to-end) is the final gate before shipping.

**Why:** Unit mocks diverge from production behavior; transient Haiku failures are real and can only be validated by exercising the real service.

**How to apply:** For tasks touching critical paths (retry, compression, session lifecycle), include a live smoke/gate test in the final subtask before marking complete.
