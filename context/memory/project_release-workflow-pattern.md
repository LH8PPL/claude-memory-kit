---
id: P-aaA72GVa
aliases: [P-aaA72GVa]
type: project
shape: Timeless
title: Release Workflow Pattern
created_at: 2026-08-13T13:16:25Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4bda0f6e8f91c37081ce61cb4973a61d39d73073626d160256b7e001ce712a16
related: [version-cut-workflow-pattern, release-trigger-tag-push-publishes, post-merge-workflow-sequence]
---

Release process follows this sequence:
- Sweep phase: multiple cleanup/consolidation PRs merged
- Encoding fix batch: targeted fix PRs (e.g., PR #358)
- Release mechanic: automated or semi-automated process
- Tag command: final step, run by user

**Why:** Establishes the standard release workflow pattern; reference for future version cuts

**How to apply:** Follow this sequence when cutting a new version; monitor each phase's completion before moving to the next
