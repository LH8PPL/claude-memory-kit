---
id: P-SEZYAQE5
type: project
title: Extract Shared Discovery Logic to Prevent Drift
created_at: 2026-06-26T11:36:40Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 7102d54c007a84e9413cd2a825ab0043eac3ac78bebe8fa4dbc7670f49449d5d
related: [project-root-discovery-must-stop-at-home-boundary, cmk-version-bumping-convention, research-findings-task-filing]
---

When multiple walkers implement similar logic (e.g., both walking upward for `context/`), extract the common parts into shared functions (`discoverRootUpward`, `canonicalPath`).

**Why:** Prevents the two implementations from diverging over time, which introduces subtle bugs.

**How to apply:** If a new discovery walker is added or the walk algorithm changes, ensure all walkers use the same extracted functions rather than copy-pasting.
