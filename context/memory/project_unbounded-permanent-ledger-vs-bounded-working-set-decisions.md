---
id: P-AYFCJ25H
type: project
title: Unbounded Permanent Ledger vs Bounded Working Set (DECISIONS.md vs MEMORY.md)
created_at: 2026-06-15T16:33:18Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 25f98c6050093840f7e093bc2354af6440090518418570503089ce42c2fcbdca
related: [decisions-md-is-append-only-permanent-journal-not-regenerate, regenerated-surfaces-vs-append-only-surfaces-digest-vs-decis, append-only-model-for-decisions-md-never-regenerate-from-liv]
---

Opposite constraints, opposite purposes:
  - MEMORY.md: bounded working set (hot cache), size cap, rolls old entries into dated archives, parking is intentional to keep focus on recent threads
  - DECISIONS.md: unbounded permanent ledger, no size cap, never parks, old decisions are most valuable (they explain why codebase is shaped the way it is)
Only explicit `cmk forget`/purge removes DECISIONS entries, and even then mark retracted (don't delete).

**Why:** Working memory and decision history need opposite strategies. MEMORY is a triage queue (keep recent threads hot). DECISIONS is a permanent record (context for architectural choices). Confusing them would either lose old decisions (parking) or bloat DECISIONS with noise (bounded).

**How to apply:** Build DECISIONS.md with no rolling, no size cap. Solve growth with better navigation (INDEX, search, date ranges) not with archiving. Reserve `cmk forget`/purge for compliance (and mark retracted, don't delete).
