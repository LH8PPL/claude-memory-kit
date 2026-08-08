---
id: P-HE3JKVMG
aliases: [P-HE3JKVMG]
type: project
shape: State
title: 'Viewer-Page Redesign Implementation: CSS & Token Values'
created_at: 2026-08-05T20:42:04Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 23d514e30b9f20187e1e8576d7af2548fbf74d0ab84105b2d9a07d914a04aa72
---

Redesign includes:
- `--measure: 720px` (layout width); `.d1` at 56px
- Design tokens fixed in both light/dark themes
- `COMMUNITY` capped at 3 colors + neutral
- `TRUST_ARC` as rim arc
- Degree-scaled repulsion: `n.q = 1500 + 1400 * Math.sqrt(n.deg)` (produces clustering)
- Code preserves `#region text-render` markers for test extraction

**Why:** These are the concrete specifications of the landed redesign. They define the component's structure and must be preserved through validation.

**How to apply:** Verify these implementations survive the validation workflow. They are required for correct clustering and visual hierarchy.
