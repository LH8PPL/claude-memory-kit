---
id: P-VHDD6VVV
type: project
title: Direct-to-Main Approval by Campaign Rules
created_at: 2026-06-13T12:10:57Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: e29a20a18da4a09d596199cacd4cf706c221727a
related: [production-code-must-go-through-pr-ci, production-code-changes-need-a-pr-never-direct-to-main, full-gate-re-run-on-final-code-after-code-review]
---

Direct-to-main commits allowed only for docs/scaffold follow-ups per campaign rules. Production code changes (e.g., install.mjs) must go through PR/CI cycle (branch → PR → CI → merge), even for fixes that seem localized.

**Why:** Enforces code quality gates and test verification. Committing production code directly to main breaks CI discipline and prevents the full test run from catching integration issues. Also: never commit when test failures are present.

**How to apply:** When committing production code, open a branch, file a PR, wait for CI, then merge. Reserve direct-to-main only for documentation, scaffolding, or non-code files per campaign rules.
