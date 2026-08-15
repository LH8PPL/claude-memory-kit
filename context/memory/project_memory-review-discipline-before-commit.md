---
id: P-a7Wa5MDE
type: project
title: Memory Review Discipline Before Commit
created_at: 2026-06-22T17:39:38Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 7aa91953284f8a802d510133618ad2fea284c5a51d44257f26cbccd03c4beac4
related: [dogfood-decisions-md-committed-post-merge-not-with-feature-p, dogfood-memory-architecture-session-recall-vs-authoritative, always-fix-markdown-lint-warnings-md022-blanks-around-headin]
---

Auto-generated memory captures are produced to `context/` by the extraction system but must NOT be auto-committed. They require manual review by the user and are committed separately, never auto-committed in the user's voice.

**Why:** Manual review gates ensure auto-extracted facts are accurate, well-formed, and reflect genuine intent — prevents stale or incorrect captures from being recorded as durable knowledge.

**How to apply:** When auto-extract produces changes in `context/`, leave them uncommitted. Review each capture for accuracy/relevance, edit if needed, then commit with a dedicated memory-focused commit message (separate from code PRs).
