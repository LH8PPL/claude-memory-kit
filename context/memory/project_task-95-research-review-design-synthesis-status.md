---
id: P-GP5CEG9H
type: project
shape: State
title: Task 95 Research Review — Design Synthesis Status
created_at: 2026-07-18T13:38:52Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: bb8086697360d59a8424241111f36ae79ae708fc5528080068ad68d63da43505
related: [task-95-design-forks-settled-2026-07-18-d-352-f1-op-class-sp]
---

**Phase:** Paper ingestion + design-input synthesis (active)

**Completed work:**
- Ingested: "Language Models Need Sleep Learning to Self-Modify and Consolidate Memories" (paper 1)
- Re-read: 10 base sources (Dreams, mem0, graphiti, TencentDB, Memora, AutoMem, stash, Always-On survey, memclaw, ADR-0017)
- Produced: synthesis note (docs/research/2026-07-18-task-95-design-input-synthesis.md)

**Design decisions from research:**
- Op set: add, update, supersede-mark (never delete)
- Flow: deterministic dedup → batched LLM pass → code decides (event-time wins; hallucinated ids rejected)
- Consolidation: conservative merging (over-consolidation measured as failure mode)
- Input requirement: raw transcripts only (measured better outcomes)
- Output gates: regression-gated; provenance retained; never resurrect forgotten facts

**Remaining grill (refined scope):**
- F1: Which op classes auto-apply (safe, non-destructive marks) vs adopt-or-discard (lossy merges, new insights)
- F2: Extend write-screen to consolidation pass + tag source-trust per claim
- v1 scope: facts-only or include schema self-audit
- v1 cadence: TBD

**Next:** Continue paper ingestion or run grill review per user direction

**Why:** Research base now synthesized; design frame emerging and externally validated; remaining questions are more focused.

**How to apply:** Use as reference for grill decisions, v0.6.0 planning, and scope decisions.
