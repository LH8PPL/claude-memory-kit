---
id: P-66TG4TaV
type: project
shape: Preference
title: Extend File Rewrite Rule to All Tools
created_at: 2026-07-20T13:49:04Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: f01ff843a2ae4da408116171090c658a2894f94a3e3438b198946c688b573fd2
related: [line-ending-normalization-risk-in-python-rewrites, sonarcloud-then-in-object-false-positive-schema-fields, reference-implementation-alignment-strategy]
---

The repo rule "never use Set-Content on repo files" should be extended to cover whole-file rewrites by any tool, not just PowerShell. The assistant violated this by using Python to rewrite a file, which normalized line endings and broke vitest's parser.

**Why:** Whole-file rewrites in any language/tool have the same risk — they can silently alter file structure (line endings, whitespace) in ways that break downstream tooling.

**How to apply:** Document the rule as "avoid whole-file rewrites on repo files; use targeted edits instead" and apply it project-wide. When updating a file, prefer surgical edits (lines, regions) over complete rewrites.
