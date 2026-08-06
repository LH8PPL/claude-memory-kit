---
id: P-4GENaCFM
aliases: [P-4GENaCFM]
type: project
shape: Event
title: Graph Layout Fixed—Window-Responsive, No Scroll Required
created_at: 2026-08-05T21:27:23Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 1cbd1f3d4bc812427ed5bc9fe1673b10b94a21e7a7299056fb06772c0952ba60
---

Problem: graph displayed below the fold with explanatory paragraph above it, requiring scroll/reposition
Root cause: design brief's "display type tier" and "corpus overview" hints were misapplied to Graph view (where the graph IS the content)

Solution applied:
- Removed 1-paragraph explanation (duplicated the rail legend's "Reading it" section)
- Compacted header to one line (was verbose)
- Graph sizing: changed from fixed 620px to responsive (window-sized canvas)
- Removed rail `max-height` so legend stretches with canvas
- Reduced footer padding by 88px (clawed back space)
- Narrow windows: graph and rail now stack vertically (responsive layout)
- Added regression test to prevent future redesigns from silently pushing hero content below fold

**Why:** UX defect caught through user question; design pattern mistake where explanatory text duplication wasted the primary viewport

**How to apply:** Reference for responsive design (let instrument use available viewport space) and regression testing (pin layout expectations)
