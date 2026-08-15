---
id: P-9PR6SXW5
type: project
shape: Preference
title: Dogfood DECISIONS.md committed post-merge, not with feature PR
created_at: 2026-07-16T07:35:56Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 32148706bef55a303abbdf253708f825f4521c2351a9a65a529883b0d6f41df0
related: [flush-memory-to-main-before-creating-feature-branch, task-boundary-memory-flush-rule, planning-docs-as-standalone-commits-on-main]
---

Changes to `context/DECISIONS.md` made during development ("dogfood") are not committed with the main feature PR. Instead, they're committed separately in a "post-merge memory-flush commit" following the task-boundary rule.

**Why:** Separates code/feature changes from self-referential metadata

**How to apply:** Leave DECISIONS.md uncommitted during feature PR development. After merge, commit it in a dedicated memory-flush commit.
