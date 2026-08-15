---
id: P-T44Q77R6
type: project
shape: Event
title: Task 252 review completed — six bugs fixed via multi-round fixes
created_at: 2026-07-28T08:06:37Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 52d2525cfb21d01f5e9558df9127f6f505feb857812f9fa971f66a3e682c2694
related: [binding-two-pass-code-review-discipline, two-pass-fix-discipline, two-pass-review-discipline-validated-on-critical-bugs]
---

Task 252 review fixed six bugs across multiple correction rounds:
- Live non-ASCII PII leak (maskPii core defect)
- Regression introduced by the first fix (caught by reviewer)
- Four additional defects from blocking issue reproduction and validation

PR #330 opened for merge with D-408 (closes D-406, supersedes D-395). All 9 findings addressed; both blocking issues reproduced before fix and re-verified after.

**Why:** Demonstrates how initial fixes introduce regressions and how the review cycle catches and corrects them iteratively.

**How to apply:** Expect small fixes to introduce regressions; plan multi-round review and re-verification after each fix.
