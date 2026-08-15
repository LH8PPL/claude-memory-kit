---
id: P-32DWHP4G
type: project
title: Regenerated Surfaces vs Append-Only Surfaces (Digest vs DECISIONS.md)
created_at: 2026-06-15T16:33:18Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: ef436af555d85ddc112183806e8766dcceec239d378a0c86241cf6e073f6bebb
related: [decisions-md-is-append-only-permanent-journal-not-regenerate, append-only-model-for-decisions-md-never-regenerate-from-liv, kit-produces-facts-not-views-the-decisions-md-gap]
---

Two different update strategies for different purposes:
  - `cmk digest` (all-knowledge render): regenerated from current live facts, shows "what we know now", deletes obsolete entries, always consistent snapshot
  - DECISIONS.md (decision journal): append-only, never regenerated, shows "what we decided over time", keeps superseded/retracted decisions visible and annotated
They can diverge: digest has facts DECISIONS doesn't; DECISIONS has dead entries digest dropped.

**Why:** They answer different questions. Digest = "current knowledge" (regeneration correct, always consistent). DECISIONS = "why did we decide this" (append correct, history is the point). Regenerating DECISIONS erases context; appending digest fills it with noise.

**How to apply:** Implement `cmk digest` as a generated view (regenerate periodically from facts). Implement DECISIONS.md as kit-maintained append (entries appended at decision-capture time). Keep both in context/ with opposite maintenance models.
