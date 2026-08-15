---
id: P-XSa5CT53
type: project
shape: Timeless
title: Two-Pass Fix Discipline
created_at: 2026-07-15T20:14:16Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 049b3af03fef2e9f30bad675aaf586f1864eaa5dcc03490d7d62216710c84bc1
related: [two-pass-pr-discipline, post-fix-integration-workflow, tarball-artifact-must-carry-both-d-263-and-d-264]
---

Findings from review are fixed inline (in the same commit/PR cycle) before the PR opens. The PR is not opened until all review findings are resolved, including minor items.

**Why:** Keeps PR quality high and eliminates follow-up fixes after the PR is opened.

**How to apply:** After a review completes, fix all identified issues before opening the PR.
