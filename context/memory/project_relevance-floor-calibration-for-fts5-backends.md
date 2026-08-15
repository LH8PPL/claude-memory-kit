---
id: P-KBEXAa9S
type: project
shape: Timeless
title: Relevance-Floor Calibration for FTS5 Backends
created_at: 2026-07-22T19:20:13Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 2e4e383304c1cc86c0d46adcd744594873a226340dc64854b94abb6efe6ce78a
related: [relevance-threshold-calibration-octopoda-s-0-80-0-45-lesson, resume-fact-convention-capturing-uncommitted-code-intent, cmk-view-integrates-with-core-memory-subsystems]
---

Octopoda project research shows relevance floors must be conservative. Their 0.80 floor silently filtered 5 of 7 relevant facts before they lowered it to 0.45. For Task 233's FTS5-backed hint backend, the relevance floor should be tunable (not hardcoded) and set conservatively to avoid silently dropping relevant results.

**Why:** High floors create false negatives that go unnoticed; for retrieval, false negatives are worse than false positives. Octopoda's quantified data directly applies to our recall requirements.

**How to apply:** When implementing bm25 filtering for the hint retrieval, make the floor a configuration parameter (tunable, not baked in). Set conservatively (0.4–0.5 range) and document the precision/recall tradeoff. Test empirically on your memory corpus before deployment.
