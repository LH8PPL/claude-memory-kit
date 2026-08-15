---
id: P-F6Z4YEWR
type: project
shape: Timeless
title: Never-Hand-Edit-Memory Rule
created_at: 2026-07-12T12:27:20Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4feaa245b3dc75f43f3ed601c4900bb9edf49db4ed587622747c3e55162145a7
related: [memory-system-deduplication-design, claude-memory-kit-captures-dogfood-facts-about-its-own-debug, near-duplicate-handling-in-autolink]
---

The project enforces a policy of not manually editing or deleting memory files after auto-capture. All post-capture curation (dedup, consolidation, cleanup) is performed by the system's automated sweeps, never by hand.

**Why:** Preserves the audit trail of what was auto-captured and ensures memory integrity is maintained systematically. Hand-editing would introduce inconsistency and bypass the dedup/consolidation logic.

**How to apply:** When reviewing memory and noticing near-duplicates, overlaps, or apparent redundancies, resist hand-deletion. Trust the automated dedup sweep to consolidate them over time. Accept that the capture process generates multiple angles on the same insight as a natural part of operation.
