---
id: P-R3CDVGU9
type: project
shape: State
title: 'Graph Visualization Feedback: Edge Density is the Limiting Factor'
created_at: 2026-07-23T13:54:22Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 508371195e71d526f71fbc679e3a6c9ba52f9ddde3010d1ee59c33bca476b659
related: [task-232-rebuild-edge-table-from-markdown]
---

- **Current state**: Corpus has ~5% edge density (only ~5% of facts carry `related:` links)
- **Root cause**: Auto-extract has never written edges; visibility doesn't automatically drive authorship
- **Hypothesis test** (ADR-0023): "Do agents author edges when they can see them?"
- **First data point**: User expects "wow" from visualization; with 5% edges, it's underwhelming
- **Key insight**: Neo4j with same corpus would be equally underwhelming—it's an authorship problem, not storage
- **Remediation paths** (cost order):
  1. Deterministic densification: link facts sharing D-nnn/Task-nnn anchors (zero LLM)
  2. Auto-extract enhancement: write `related:` edges during extraction
  3. LLM-derived semantic edges (gated in ADR-0023)

**Why:** The user's dissatisfaction reveals a gap between expected (serendipitous connections) and actual (sparse corpus). This measurement and framework are essential for 255 grill design decisions and next-phase planning.

**How to apply:** Reference edge-density baseline and remediation paths when making viewer design decisions. Consider quick-win densification (option 1) before heavier investments.
