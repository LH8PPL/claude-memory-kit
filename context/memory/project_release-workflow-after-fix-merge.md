---
id: P-9JAFTQC4
type: project
shape: State
title: Release Workflow After Fix Merge
created_at: 2026-07-03T12:29:34Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 91656027f1f8e23501ccea9c0acca0981951ace6bb721721c5a1b5f5426eb4e1
related: [v0-5-1-release-pr-282-must-merge-before-tag, release-workflow-sequence, v0-3-1-release-final-workflow]
---

After a fix passes all verification gates and is merged to main:
1. Commit to main
2. PR and merge (gates already passed)
3. Re-pack tarball (release artifact)
4. **Session 2 (recall)** — the last interactive validation gate before tagging
5. Tag (final production release)

Session 2 (recall) is an explicit manual review checkpoint.

**Why:** Provides a staged release workflow with a final interactive review opportunity before the irreversible tag step.

**How to apply:** After merging a fix, sequence through tarball re-pack, then Session 2 (recall) for final review, then tag. Session 2 is a hard gate — nothing ships without it.
