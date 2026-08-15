---
id: P-4VYW5YJZ
type: project
shape: Plan
title: v0.6.2 Release Tail Workflow
created_at: 2026-07-22T07:17:37Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 5cd0c05de0e869e4939c13211d554691a47fd683dff8412b8d51417626736de8
related: [v0-5-0-release-workflow-stress-commit-push-pr-merge-repack-g, release-workflow-sequence, post-merge-workflow-sequence]
---

- Precondition: stress test passes (5/5)
- Then:
  1. Open PR 245
  2. Run CI enumeration
  3. Merge PR 245
  4. File D-nnn citation-gap task
  5. Decide PR 246 stranded-fact recovery approach
  6. Cut release

**Why:** Sequences the final release steps; structure may apply as a template to future releases

**How to apply:** After stress test completes, follow this checklist in order; use as a release tail template
