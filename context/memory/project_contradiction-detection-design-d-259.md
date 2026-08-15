---
id: P-UXNMS2M3
type: project
title: Contradiction Detection Design (D-259)
created_at: 2026-07-02T11:54:29Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 8a26953f099f8860a44d77d1adce00d918b4793b7af05706790ba9f06a5cf01c
related: [task-66-subtask-dependencies-and-next-gate]
---

**Core approach**: same-subject grouping + batched Haiku judgment + timestamp resolution

**Workflow**:
- At write time: search finds same-subject candidates (using kit's own search, not LLM)
- Weekly curate sweep: batched Haiku call judges pairs → SUPERSEDES (closes old fact's validity window), DUPLICATE (recurrence bump), COEXIST (drops)
- Resolution: timestamp decides (latest-wins rule); LLM never decides who wins

**Design closures by data**:
- `state_key`: derived from search, not declared as a user field
- Captain-claw "hold tension" idea (D-221): rejected (zero genuine simultaneous disagreements found in 1,246 facts)

**Why:** Experiments on dogfood corpus (1,246 real facts) showed lexical similarity fails (zero pairs >0.5 score), but subject grouping + Haiku achieves perfect classification; contradictions share subjects, not words

**How to apply:** Build 66.2/66.4 implementation against this design; reference D-259 in code; handle FTS5 version-token queries with quoted literals
