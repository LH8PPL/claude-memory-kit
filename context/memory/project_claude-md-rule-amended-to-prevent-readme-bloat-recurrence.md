---
id: P-YP45KJVQ
aliases: [P-YP45KJVQ]
type: project
shape: State
title: CLAUDE.md Rule Amended to Prevent README Bloat Recurrence
created_at: 2026-08-03T13:49:43Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 1292aaf982f052df3def4f97e34b1d5ce6aec730c99cd82e8e2a5f928efcbe37
related: [documentation-structure-and-prerequisite-locations, dogfood-decisions-md-committed-post-merge-not-with-feature-p, binding-rule-readme-line-for-user-facing-features]
---

A rule in CLAUDE.md was causing the problem it was meant to prevent (likely: "every feature gets a README line").
The rule has been amended to prevent the refactored lean README from re-growing over time.

**Why:** The original rule incentivized bloat; fixing the rule at source is necessary to keep the new structure from rebuilding itself

**How to apply:** Review the amended CLAUDE.md rule; future feature additions must follow the new rule to maintain README brevity
