---
id: P-ULHVR7L2
type: project
title: Canonical Registry for Persona Search
created_at: 2026-07-01T10:52:32Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 19271ccf0d954a936e436451114978ffd4d6d240c0fdf07de5305bad78418444
related: [cmk-version-bumping-convention, privacy-sanitization-pattern-for-all-prompt-handling, research-notes-indexed-via-research-index-not-documentation]
---

The fix for Task 182 (persona searchability) iterates `SCRATCHPADS_BY_TIER` (the kit's canonical registry of memory tiers) instead of hardcoding `MEMORY.md`. This ensures the search uses a single source of truth.

**Why:** Hardcoding paths risks divergence when the registry changes. Using the canonical registry prevents drift.

**How to apply:** When working on persona search or any feature enumerating memory tiers, use the kit's `SCRATCHPADS_BY_TIER` registry, not hardcoded paths.
