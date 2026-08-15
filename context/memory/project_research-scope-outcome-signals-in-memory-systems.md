---
id: P-QE4SQY2F
type: project
title: 'Research Scope: Outcome Signals in Memory Systems'
created_at: 2026-07-01T15:17:31Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 6739349943ba45caf3938d3abd8e8101aacad04f76bcd245a14844b9f909cdcf
related: [memory-systems-failure-learning-survey-9-systems, prior-research-outputs-d-218-and-d-227, user-runs-full-stack-semantic-and-crons]
---

Focus research question: Do any surveyed memory systems close the learning loop by feeding back outcomes (did remembered action succeed?), or are they all store-and-retrieve?

Scope: Code-read existing systems (mem0, letta, graphiti, memclaw, MemOS, ReasoningBank, ReMe, MemRL).

Deliverable: Document who feeds outcomes back, how, and the honest signal portfolio—which signals are real, which are junk.

**Why:** Outcome-signal feedback is the linchpin of the learning loop. Assistant's claim ("nobody does it") is unverified; worth checking against actual code before ADR.

**How to apply:** Conduct tight, focused code-reading pass on systems already cloned. This finding becomes foundation for ADR-0017.
