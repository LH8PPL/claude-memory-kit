---
id: P-WJF4EQPK
aliases: [P-WJF4EQPK]
type: project
shape: State
title: Viewer Page Visual Design Constraints
created_at: 2026-08-03T13:34:35Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: cfd48744ffcef2f58b8b284734a1adbe6b0cb8741d9a63a9856de9811fd1834e
---

- Background: off-white with white panels (not pure white)
- Color palette: one neutral ramp + one accent (~5% of pixels)
- Typography: three spacing values, four type sizes
- Separation: 1px alpha borders instead of shadows
- Empirical validation: Deno docs (117 KB CSS, zero shadows), Datasette (one shadow only)

**Why:** Provides durable design foundation for visual pass without re-deriving; empirically validated by third-party research

**How to apply:** Reference when implementing Task 260 visual redesign; use as acceptance criteria for visual work
