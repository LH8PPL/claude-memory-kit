---
id: P-MAVB6VGU
type: project
shape: Timeless
title: Multi-Step Research Ingestion Integration Workflow
created_at: 2026-07-21T07:56:44Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 234b2091fbf8928b4258be47c66d26454927232034c9bb1c2bdb8e1aa6daeb06
related: [byte-preservation-verification-workflow-for-archive-splits, d-153-research-quality-discipline-for-agent-reading-tasks, post-merge-workflow-sequence]
---

When completing a large research reading task (29+ notes):
1. Verify all source documents exist on disk (not just trusting agent summaries)
2. Compile full blocked-URL list and hand to user for manual fetching
3. Integration phase: update INDEX.md, SOURCES.md, DECISION-LOG; add task annotations, validators; commit
4. Review synthesis verdicts together (especially ADR-0023 re-open-or-confirm call and dreaming corpus analysis)
5. Follow-up verification pass: read manually-fetched blocked pages against original claims to properly close two-hop attributions (don't leave dangling)

**Why:** Separates concerns — user handles access barriers (HTTP 403s), assistant ensures claims verification. Prevents attributions from being incomplete or speculative. Follow-up pass guarantees fetched pages actually verify what they were cited for.

**How to apply:** Apply this sequence for similar multi-source research ingestions. Particularly important when HTTP 403 blocks prevent direct verification; manual user fetch + re-check pass closes the attribution gap.
