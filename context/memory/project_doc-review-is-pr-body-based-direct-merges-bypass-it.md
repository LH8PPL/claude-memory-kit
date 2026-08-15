---
id: P-S6VBB4JE
type: project
shape: State
title: Doc Review is PR-Body-Based; Direct Merges Bypass It
created_at: 2026-07-21T06:59:23Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c5cfefc97b60c781dfe634e73eb8b75732ae5df04cf00a0267bbb941d8a6fd40
related: [binding-rule-readme-line-for-user-facing-features, clean-pre-existing-table-lint-warnings-by-default, hooktimeout-identified-as-root-cause-of-d-406]
---

Doc review happens in the PR body during code review. Direct merges bypass this gate entirely. Task 174 merged directly, causing three doc gaps to slip (README, checkbox, changelog section). The PR workflow is the enforcement mechanism for doc updates.

**Why:** Assistant identified direct merge as the root cause of stale docs despite binding rules.

**How to apply:** Enforce PR-based merges to protect doc review, or add a separate doc-review step for direct merges.
