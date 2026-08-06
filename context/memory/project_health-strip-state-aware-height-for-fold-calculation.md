---
id: P-ES4M4PGR
aliases: [P-ES4M4PGR]
type: project
shape: State
title: Health Strip State-Aware Height for Fold Calculation
created_at: 2026-08-06T05:38:58Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 05edd1d1728d100d766773fc1f126729cbf13ae401a80915514bbfa323b097f2
---

The health strip (indicating fact freshness / data staleness) has multiple visual states: healthy (baseline), warn, and bad. The healthy state is used for initial layout calculations. When health changes to warn or bad after page load, the strip expands intentionally — full width, larger text, pushes the freshness label to a second line — adding ~45px of height. If the fold height (viewport height minus chrome) is calculated once at load time assuming the healthy state, the strip's later expansion will push content below the fold and trigger a scrollbar mid-session. To fix this, the fold height calculation must be state-aware and account for the potential ~45px expansion in warn/bad states.

**Why:** This prevents jank and visual incorrectness; the fold height fix initially missed this because it didn't account for the state transition.

**How to apply:** When calculating fold height or any fixed-height container that accommodates the health strip, use state-aware logic: start with the healthy baseline and add ~45px if the current health state is warn or bad. Test with health in all three states to verify the layout doesn't break.
