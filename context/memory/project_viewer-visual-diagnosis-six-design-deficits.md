---
id: P-4W2VYTB7
aliases: [P-4W2VYTB7]
type: project
shape: State
title: 'Viewer Visual Diagnosis: Six Design Deficits'
created_at: 2026-08-03T13:31:04Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 967eb21bc28e0ea5f897adbd7eda3246cca1dce0bb6db1b3e33f7e8a2eef5a5e
---

Concrete design issues making the viewer page look flat, ranked by impact:
- **No card title**: every fact is one undifferentiated 15px paragraph (no typographic hierarchy)
- **Measure too wide**: running ~1040px vs reference 650px, making line-lengths feel like a dump
- **Outlined badges**: visual static (five outlined pills per card); references use tinted backgrounds instead
- **No surface separation**: page is #fbfaf8 on #ffffff (2% difference); references use warm palettes (#2b2520 ink, #efebe4 panel)
- **Health strip prominence**: status indicator dominates the page despite being good state; should be a small pill, grows only when alerting
- **Graph orphan nodes**: ~150 degree-0 nodes remain unrelaxed at border; labels overlap on white
- **Markdown leak**: code like `**Global install**:` renders literally in snippets

All fixes are containable within one HTML file, no architecture change, zero dependencies.

**Why:** These are the specific constraints that should drive the next implementation task (viewer visual pass). Each point has a concrete fix that the research references validate.

**How to apply:** File these as Task 260 requirements — the diagnostic categories should be the acceptance criteria. When implementation starts, verify each fix against the reference screenshots (claude-mem-card-variants.png for card hierarchy, everos-dash.png for surface + token quality).
