---
id: P-6BK7E49P
aliases: [P-6BK7E49P]
type: project
shape: State
title: SonarCloud Coverage Gate at 80% on New Code
created_at: 2026-08-06T08:00:16Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 038d9b325f7c69ab683dab7676aabe9d379ff3e4aa175d730c9c2c9df65f785c
---

- Enforces **80% coverage on new code** (per-PR basis, not total codebase)
- Blocks PR merge if new code falls below this threshold
- Example: PR #344 initially failed at 77.6% new-code coverage until boundary tests were added

**Why:** Prevents regressions in new features; this per-PR constraint is stricter than total coverage measurement

**How to apply:** When shipping new code, target 80%+ coverage. SonarCloud flags coverage gaps by path; prioritize error-handling paths and boundary conditions.
