---
id: P-FBU44TEX
type: project
shape: Timeless
title: Map Module Sort Determinism — localeCompare Banned, Explicit Ordering Required
created_at: 2026-07-23T09:25:36Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c74f32c9f615dc1c80f068b917436914f2d21da0aabbd7e3a6d6923704fb5f14
related: [use-deterministic-comparators-for-sorting-committed-files, cross-machine-file-sorting-must-be-byte-deterministic, b3-b4-wedge-test-workflow-cross-project-doctrine-capture-val]
---

Sort ordering in the map module must be explicit and deterministic across all machines:
- `localeCompare()` is explicitly banned because it breaks byte-stability across different locales and machines
- All sorts must use byte-stable comparisons (e.g., default string comparison) instead of locale-aware or implicit ordering
- Output is verified with real-corpus before/after diffs to ensure byte-identical results across development environments

**Why:** The map module generates committed artifacts (`MAP.md`) that are included in version control and must be reproducible across all machines. Locale-dependent or implicit sorting causes non-deterministic output, breaking the determinism guarantee that the map depends on.

**How to apply:** When implementing sorts in map-module code, make all comparisons explicit and byte-stable. Validate with real-corpus diffs before committing to confirm byte-identical output. Never use `localeCompare()` for map-module comparisons. The Sonar gate will catch violations of this rule.
