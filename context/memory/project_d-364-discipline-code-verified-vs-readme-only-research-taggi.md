---
id: P-DZ7BVLGW
type: project
shape: State
title: D-364 Discipline — Code-Verified vs README-Only Research Tagging
created_at: 2026-07-22T17:04:23Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: d8ea83e9e08de0f0b561e1a41613aa55cef9cf416e179900f944d01ea15ec6e9
related: [d-364-discipline-for-external-source-claims, work-items-require-task-entry-before-implementation, research-verification-workflow-parallel-agents-batch-integra]
---

Tag external research findings as either **code-verified** (file paths, observed implementation) or **README-only** (documentation, not code-validated). Surfaces unvalidated claims before they influence design.

**Why:** Field flagships often ship less than READMEs promise. The discipline forces a distinction between documentation and code reality, preventing decisions on false assumptions.

**How to apply:** Apply to all research tasks involving external codebases. Annotate findings in task registry with verification source.
