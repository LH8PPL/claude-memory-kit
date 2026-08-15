---
id: P-DFCJLVUA
aliases: [P-DFCJLVUA]
type: project
shape: Timeless
title: PR Review Workflow — Worktree + Reproduction + Severity Ranking
created_at: 2026-08-09T07:49:48Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a6c27bc52c35d2b58c3f86efbee6d6659ec6cb6d0f6fe166786ff344a7ad7b2d
related: [two-pass-review-discipline-validated-on-critical-bugs, full-gate-re-run-on-final-code-after-code-review]
---

Code review process for claude-memory-kit PRs:
- Isolate the branch in a dedicated worktree (e.g., `.claude/worktrees/agent-afe538ca064828b15`) to prevent local state contamination
- Run full linting and targeted test suite (npm run lint, npm run test:file -- <path>)
- Reproduce high-severity findings with runnable scripts on the branch (not inference)
- Rank findings by severity (Blocking → Important → Minor) and real-world impact
- Document clean passes (XSS, contrast, consistency checks) so they're not re-audited

**Why:** Worktree isolation + runnable reproducers catch real merge-blocking bugs (paging drop-dup, offset overflow, budget registry gaps) before code ships; catching at review time beats user-reported bugs.

**How to apply:** Apply this workflow to complex PRs; prioritize reproduction over inference; rank findings; document why clean findings pass; use severity ranking to manage review scope.
