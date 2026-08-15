---
id: P-EYLNZYPC
type: project
shape: Timeless
title: 'Task 237 Delivery Chain: Scan → File Issue → Auto-Close'
created_at: 2026-07-22T07:40:51Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 1c8cac379d13a0192744aac87158249db9b6b2117cf39756a05bf57f222c1b52
related: [post-fix-integration-workflow, release-workflow-tag-before-merging-new-work, supply-chain-watch-issue-filing-fixed-task-237]
---

Task 237 automates the full advisory response loop: scan for vulnerabilities, file a GitHub issue if found, auto-close when the dependency is fixed. The chain was live-verified end-to-end in this cycle by manually dispatching against main (unfixed version), generating the issue, then merging the fix and confirming auto-close executes.

**Why:** Automation chains can silently break at any stage (scan finds nothing, issue doesn't file, auto-close doesn't trigger). Live testing before the fix merges catches these gaps.

**How to apply:** When shipping a dependency fix, manually trigger the scan against the unfixed version to exercise the entire flow (scan → file → merge fix → auto-close) once.
