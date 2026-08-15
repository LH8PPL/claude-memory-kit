---
id: P-5KXaLFDC
type: project
title: 'Context Buffer Stabilization: 19 Systems Classified by Approach'
created_at: 2026-06-18T20:16:34Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 59be431026fb28f60204a3a1f2b8bb02bbbba16ea9f0f2ad09190fcb0d95376e
related: [a-c-core-design-pivot-memsearch-anchored-b-dropped]
---

Empirical analysis of 19 memory-management systems against three stabilization families:

- **B** = structural buffer cap (mid-session or deque-level size limit)
- **A** = deterministic pre-truncate (guarantee fit before model call)
- **C** = partial-evict / windowing (keep-recent or summarize-oldest, not full reset)

Classification:
- **All three (A+B+C):** memsearch, Letta
- **~2.5 of three:** MemOS (cap + head/tail truncate + time-window), TencentDB (batch cap + emergency truncate + MIN_KEEP)
- **One or two:** OpenHands, MemoryOS, mempalace, langmem/LightMem, graphiti, cognee, honcho, memweave, mem0, claude-mem, squad, claude-remember
- **Special cases:** basic-memory (no LLM); some sidestep buffer entirely; some lack pre-truncate

The two closest analogues (memsearch, Letta—both Claude-adjacent plugins) both use all three, validating A+B+C. But simpler systems achieve spiral-proof with just one family.

**Why:** The proposed A+B+C+D exceeds what 17/19 systems do. The two most-similar systems validate A+B+C but not D. This opens a simplification fork: is full A+B+C justified, or does B+C (with defensive A) suffice?

**How to apply:** Use memsearch/Letta as reference for A+B+C. In implementation, decide empirically: commit to all four, or defer D to Phase 2 after latency data?
