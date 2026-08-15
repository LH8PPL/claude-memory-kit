---
id: P-KE5RQUKJ
type: project
shape: Timeless
title: 'Resume Fact Convention: Capturing Uncommitted Code Intent'
created_at: 2026-07-05T13:47:11Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 3a542105d6a607c32a0b7254c0f61a11a10b625720cb29222998348638ead1f6
related: [skill-review-imported-facts-staleness-bug-fixed, uncommitted-change-in-docs-process-cut-gate-md, pre-commit-hook-sanitizes-fact-files-for-security]
---

The project uses "resume facts" in the codebase memory to preserve the shape and intent of code that is not yet ready for commit.

Example: a stray test (`cli-cursor-backend.test.js`) was gated on pending deep research. Rather than commit it or discard it silently, its shape was preserved in a resume fact, then the file was removed from the working tree.

**Why:** This allows cleanup of uncommitted work without losing the design intent, making it easy for the next session to recall what was being attempted and why it was deferred.

**How to apply:** When removing uncommitted code that has lasting intent, preserve its shape and rationale in a resume fact before deletion. Reference it when that gate is lifted.
