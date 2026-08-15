---
id: P-YNSBPRQH
aliases: [P-YNSBPRQH]
type: project
shape: Timeless
title: Technical Patterns Worth Integrating (Competitive Research)
created_at: 2026-08-15T08:27:36Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 01f9627c4202f85e59e5361681d1c81eef6a0e3004ae7b0842a611601a933caf
---

Discovered across RepoWise, RepoSwarm, Atomic research clones:

- **MCP staleness envelope**: include snapshot-age (`_meta`) on every response; warning fires only when served fact actually diverged from source (not age-based heuristics alone)
- **Deterministic fact-staleness metric**: fraction of linked files changed since capture; composes cleanly with `related:` edges
- **Verbatim-quote grounding gate for auto-extract**: every extracted field must quote source or is dropped (prevents hallucinated or paraphrased decisions)
- **Prompt-version-keyed cache invalidation** (RepoSwarm): cache key includes prompt-schema version; invalidation is automatic when schema changes

**Why:** These patterns are battle-tested in shipping products. They solve real problems in memory lifecycle, freshness, trustworthiness, and derived-artifact staleness.

**How to apply:** Use as reference implementations when designing MCP response contracts, auto-capture screening gates, and memory-freshness signaling. Prioritize verbatim grounding and efficacy loop measurement.
