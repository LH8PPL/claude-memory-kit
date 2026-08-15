---
id: P-KBBQKUP2
type: project
shape: Timeless
title: 'Cut-Gate Workflow Order: Cut Locally → Test → Tag'
created_at: 2026-07-12T06:27:31Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 585ba8dcd61b73d045b77cbed9703240997823e9daccacaa996ae8973d9ad267
related: [v0-3-1-release-final-workflow, release-workflow-commit-cut-gate-tag-push, release-gate-structure-v0-3-0]
---

1. Cut the release locally first (so the artifact reports the correct version).
2. Build and test the artifact.
3. Tag and push the tag last (triggers CI publish).
Critical: cutting locally FIRST ensures the version is embedded in the artifact before testing. Reversing this order breaks version detection.

**Why:** Ensures tested artifact has correct version; prevents testing stale code or artifacts reporting wrong versions.

**How to apply:** Always follow this sequence. The guide (docs/process/cut-gate.md §0) documents this explicitly.
