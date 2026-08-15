---
id: P-VS9AKQ7P
type: project
title: Memory Trust Scoring — Event-Driven Instead of Server-Side
created_at: 2026-06-11T22:15:30Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 8e6551017ca613c0dedc977007bc19ffece6de2c
related: [pii-handling-non-adoption-of-quarantine]
---

Kit uses event-driven trust earning via audit log rather than memclaw's server-side outcome scoring.
- Recalls (`mk_get`/`mk_search` hits) increment `last_confirmed` and `use_count` in memory frontmatter
- Contradictions or supersedes decrement trust
- Trust is earned over a memory's lifetime, not frozen at capture
- All signals already on disk (audit log based); no LLM API calls on write

**Why:** Adopts memclaw's earned-trust insight without requiring server infrastructure or API costs on every write

**How to apply:** Reconcile audit log events and bump memory frontmatter fields; implement as Task 97
