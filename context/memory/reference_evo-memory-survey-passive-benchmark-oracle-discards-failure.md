---
id: P-4MWHPSTB
type: reference
title: 'Evo-Memory survey: passive (benchmark oracle, discards failure)'
created_at: 2026-07-01T17:38:54Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: 1cb304c2ea4204f7c02473e5611485d54996e8ab3dd193563a08921e30ec37ae
related: [research-claude-mem-claude-goal-don-t-learn-from-failure, memento-2508-16153-learns-from-failure-survey-verdict, skillrevise-learns-from-failure-only-via-a-per-task-test-ora]
---

Evo-Memory (arXiv 2511.20857, Google DeepMind; code github.com/zhaosnw/evo_mem) — U-Mem passive-vs-autonomous survey result: PASSIVE / does NOT learn from failure at the persistent-memory level. It is a BENCHMARK + framework (search-synthesize-evolve loop) with ExpRAG baseline + proposed ReMem (Think-Act-Refine). Code-level evidence: (1) base.py evolve() DISCARDS failure — `if self.store_successful_only and not state.is_successful: return` with store_successful_only=True default → a failed task writes nothing, updates no utility, creates no corrective memory. (2) No utility/weight/trust/reward field on MemoryEntry (only is_successful bool + feedback str label); corpus-wide grep for utility|reinforce|weight|trust returns zero hits in memory logic. (3) Retrieval is pure cosine similarity (retriever.py sort by score desc); is_successful never enters ranking — only rendered as a "Success/Failure" text label in the prompt. (4) ReMem's "Refine/prune" only mutates the in-context state.retrieved list for the CURRENT step (model-judged relevance via "Think-Prune: 1,3"), NOT the persistent store; the store's only prunes are FIFO capacity eviction + cosine-similarity-to-query threshold (prune_by_relevance, never called by ReMem) — neither outcome-driven. Oracle: correctness = self.metric.compute(prediction, task.target) >= 0.5 (dataset ground-truth) for single-turn; env.step() success final-state for multi-turn — a HARD BENCHMARK ORACLE, not transferable to a session host. Verdict for cmk portfolio: NO (code-level). Adds nothing new to the trust_score design.

**Why:** Part of the U-Mem-driven field survey fixing the biased 9-system convenience sample. Evo-Memory triaged "unclear" (a benchmark for test-time learning); code read settles it as passive at the memory-persistence layer and oracle-dependent, so it does NOT move the denominator toward "autonomous" and offers no failure-signal transferable to cmk's oracle-free session host.

**How to apply:** When citing Evo-Memory in the survey: classify NO / code-level / oracle-dependent (benchmark ground-truth). The discriminating file is base.py evolve() (failure = early return) + memory/base.py (no utility field) + evaluation/evaluator.py:219 (task.target oracle). Note the ReMem prune is in-context-only and relevance-based, an easy false-positive for "failure learning" — it is not.
