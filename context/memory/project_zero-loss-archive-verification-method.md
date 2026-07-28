---
id: P-4A5L794D
type: project
shape: Timeless
title: Zero-Loss Archive Verification Method
created_at: 2026-07-27T23:04:06Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a29d4fd534099d0b0755f0267c5662fe9bba125dbc9578657e75a0e9c4cb3eb3
---

Verify archive operations preserve all data with these checks:
- Byte-identical comparison across live and archive (256/257 entries must match; intentional annotations are expected)
- Baseline against main: repoint all verifiers to the pre-split tree so validation runs against ground truth, not a tree that already contains the split
- Wrong-home check: confirm no open/partial entries remain in archive and no missing entries from live
- Numbering gaps validator: unbroken Task sequence (1–257)
- Backlog triggers validator: no orphaned open top-level tasks
- Journey splits: re-verify moved blocks are byte-identical to source (zero retained/lost lines)

**Why:** Archive operations risk silent data loss and broken links. Machine-verifiable checks give confidence before merge.

**How to apply:** Run checks in sequence after implementing moves. Document the baseline tree commit hash so reviewers can re-run.
