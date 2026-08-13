---
id: P-56YEAKaU
type: project
shape: State
title: Binding Two-Pass Code Review Discipline
created_at: 2026-07-06T21:24:59Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ccb14324c64c79eb910a16c8ea93f5e1c8972a90aa447ea5f991363b55312e4b
related: [task-252-review-completed-six-bugs-fixed-via-multi-round-fix, full-gate-re-run-on-final-code-after-code-review, production-code-must-go-through-pr-ci]
---

All PRs require two sequential review passes before merge is permitted:
- **Pass 1:** Reviewer identifies findings/blockers, author fixes them
- **Pass 2 (post-fix):** Reviewer validates all findings are addressed and confirms regressions are prevented
- Auto-merge is armed only after both passes complete successfully

**Demonstrated value this session:** The second pass on #191 (judgment files) caught 2 critical blockers:
- corrupt-file crash
- replication-inflation vulnerability (double-resolving expectation inflating `n_episodes`, could fake `corroborated` status)

Both would have shipped silently and violated core feature guarantees without this discipline.

**Why:** Two-pass discipline prevents silent bugs from reaching production. The rhythm slows initial merge velocity but catches critical issues that are far costlier to fix post-release.

**How to apply:** When opening a PR, expect a two-cycle review: first feedback → fixes → second validation → auto-merge. Do not merge before both passes complete. Watch for the auto-merge notification after pass 2 clears.
