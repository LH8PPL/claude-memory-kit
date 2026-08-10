---
id: P-L5MHSW2T
type: project
shape: Timeless
title: Byte-Preservation Verification Workflow for Archive Splits
created_at: 2026-07-27T22:28:07Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: f2dd5bee5bd8db385a1fad01c8b7b2e444403b80e19b130a873247c49e19c0df
related: [three-archive-splits-at-v0-5-release-boundary, zero-loss-archive-verification-method, release-workflow-tag-before-merging-new-work]
---

For each archive split, verify lossless content transfer:
1. Segment `git show HEAD:<source-file>` into portions moved to archive
2. Check each moved block against archive with `String.includes` — confirm all original bytes present
3. Verify open/partial entries in live file remain untouched (if applicable)
4. Confirm no anchor link breakage at the seam
5. Document: count of entries moved, verified, zero failures

For interleaved/nonlinear content (like build-log.md), hand-inspect narrative coherence at the seam.

**Why:** Archive splits are lossless operations — lost or altered bytes are catastrophic. This workflow catches corruption, truncation, or reordering before commit.

**How to apply:** Follow this sequence when splitting any file into an archive. On review, verification is done independently (reviewer re-derives proof rather than trusting implementer's checks).
