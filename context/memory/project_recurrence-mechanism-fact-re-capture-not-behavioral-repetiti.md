---
id: P-7ZUCXDCQ
type: project
title: 'Recurrence Mechanism: Fact Re-capture, Not Behavioral Repetition'
created_at: 2026-07-01T07:38:56Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 52e156cf65244e2eeb014e24de6697733bed971a4a7e1fd66fdcdbf878a37f57
related: [compress-logger-observability-gap, recurrence-mechanism-increments-only-whe-tlnyhyaq]
---

The `recurrence_count` field increments only when the SAME canonical fact (matching content-hash id) is re-written, at `write-fact.mjs:240` in branch `if (existingIdAtPath === id)`. Repeated behavior in transcript (e.g., running tests 5×) produces zero recurrence bumps because behavioral repetition doesn't trigger fact writes. Auto-extract uses content-hash deduplication, not action-counting.

**Why:** The kit's pitch—"traits you demonstrate but never declare get promoted"—could mislead users into expecting behavioral-pattern inference that doesn't exist. Recurrence counts fact re-emergence ≥3× in captures, not inferred action patterns. This gap between user intuition and actual design is meaningful to document before release.

**How to apply:** In release notes and user documentation, clarify that recurrence measures fact re-surfacing in captures, not repeated behavior in transcript. Document that behavioral inference is deliberately not implemented—a design choice—so users understand actual scope and capability.
