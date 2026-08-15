---
id: P-Ua3U9EYU
type: project
title: Markdown Link Case Sensitivity Issue
created_at: 2026-06-22T17:23:37Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 52a90c294335dc91e27038f43a1768c5aec806013fa66f1c75c3c393a332b215
related: [claude-md-ci-validator-binding-rule, validate-docs-enforces-catalog-consistency, architecture-decisions-via-adr-references]
---

Broken markdown link in CLAUDE.md involving `.claude/` paths (Linux case-sensitivity issue). Fixed in commit fd349b5 (docs-only change).

**Why:** Linux CI runners enforce case-sensitive path matching, unlike Windows. Documentation links must match actual path case.

**How to apply:** When editing CLAUDE.md with file links, verify they work on case-sensitive systems or test on CI before merging.
