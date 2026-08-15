---
id: P-WWZZWFQ5
type: project
title: Memory Systems Failure-Learning Survey (9 Systems)
created_at: 2026-07-01T15:33:53Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 7661ef9f1b252e04e2ce802e7392524affb1710a40b80719f0d7074133f7a250
related: [research-scope-outcome-signals-in-memory-systems, survey-scope-and-classification-taxonomy, now-md-assistant-cap-precedent]
---

- **3 YES (ship failure learning):** memclaw (code), ReasoningBank (code), MemRL (paper)
- **1 PARTIAL:** ReMe (paper only; dropped in shipped repo)
- **5 NO (store-and-retrieve only):** mem0, letta, graphiti, MemOS, A-Mem
- **Critical finding:** 3 systems (letta, MemOS, A-Mem) define fields (`Step.feedback`, `usefulness_score`, `retrieval_count`) but leave them inert — the industry builds the socket and doesn't plug anything in.

**Why:** Establishes kit's position relative to precedent and identifies the real gap (inertness, not absence of fields).

**How to apply:** Reference when designing failure-learning mechanism or justifying ADR-0017 scope. memclaw is the only oracle-free reference architecture.
