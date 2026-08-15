---
id: P-UYPGM6MK
type: project
shape: State
title: Core-memory-kit gate chain and post-merge workflow
created_at: 2026-08-02T07:51:20Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 3d142b6619a15e7c83eab67b95e686e5560a0eca7ca81b1ba7c14b2b2c6e711d
related: [merge-gate-sequence-stress-test-must-pas-s2enbvcj, stress-gate-release-workflow, post-merge-workflow-sequence]
---

- Gate stages (all must pass): suite → stress ×5 → live-verify
- Merge decision: squash-merge when all gates pass
- Post-merge housekeeping includes memory-tier flush

**Why:** Standard workflow for commits to core-memory-kit; next session needs to know gate sequence and post-merge operations

**How to apply:** Wait for all gates to pass before merging; execute post-merge housekeeping including memory-tier flush
