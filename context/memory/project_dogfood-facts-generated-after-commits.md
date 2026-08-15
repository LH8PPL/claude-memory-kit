---
id: P-LMRJ7T54
type: project
shape: Timeless
title: Dogfood Facts Generated After Commits
created_at: 2026-07-07T18:18:33Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 918c29943cb38a33bad55d0a48a95bf0724da351713d700987c6dcc6f3ed9774
related: [memory-system-captures-work-in-real-time, claude-memory-kit-captures-dogfood-facts-about-its-own-debug, dogfood-decisions-md-committed-post-merge-not-with-feature-p]
---

The memory-kit automatically generates auto-extracted "dogfood facts" (observations about its own behavior) *after* session commits are made, by analyzing the kit's own responses and answers. These facts, plus INDEX updates, appear in a follow-up commit.

**Why:** Tool design: the kit observes and reflects on its own behavior during the session. Facts are generated from responses, so they emerge *after* the initial commit.

**How to apply:** Expect a second commit containing auto-extracted facts and INDEX updates after major session work. Include them in the final "all committed" state.
