---
id: P-MRWY2C43
type: project
title: Cut Gate Must Test Full Recall Ladder
created_at: 2026-06-11T06:44:58Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: ef60dcf969bb1e43f4ce6aaba6effa987d9ebede
related: [byte-preservation-as-hard-constraint-for-archive-splits, memory-kit-validates-itself-as-dogfood-test-subject, node-sqlite-fts5-module-availability-gate-for-task-141b-migr]
---

The cut-gate test suite must exercise all three tiers of the recall mechanism:
- L1: basic search
- L2: cited-recall (get/timeline/cite commands)
- L3: transcripts

The original guide tested L1 and L3 but skipped L2. Fixed with F-17, F-18, F-19 in commit 74b3e5c.

**Why:** The cut-gate is the kit's comprehensive health check; every subsystem must be proven to work end-to-end. Gaps in coverage may be invisible in a summary diff.

**How to apply:** When adding new commands to the kit, ensure they appear in cut-gate.md tests. Programmatically validate coverage using the docs validator method (verifies every registered verb is tested).
