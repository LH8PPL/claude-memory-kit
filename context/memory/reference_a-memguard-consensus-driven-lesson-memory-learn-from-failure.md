---
id: P-4XF9BHL4
type: reference
title: 'A-MemGuard: consensus-driven lesson memory (learn-from-failure survey)'
created_at: 2026-07-01T15:53:54Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: 052994819f563e8dc932906d7669b7c54d73813bcb984afaa2243f323f32966e
related: [memento-2508-16153-learns-from-failure-survey-verdict, skillrevise-learns-from-failure-only-via-a-per-task-test-ora, research-claude-mem-claude-goal-don-t-learn-from-failure]
---

A-MemGuard (arXiv 2510.02373, repo TangciuYueng/AMemGuard, HEAD d6082c7 2026-05-08) — survey verdict for the "does memory learn from failure?" question: PARTIAL, code-level. Mechanism (EhrAgent/ehragent/medagent.py:391-438): consensus-based validation (ConsistencyChecker in consistency.py — generate a reasoning chain per retrieved memory, then either LLM-judge consistent/safe OR DBSCAN-cluster and keep the dominant cluster) splits retrieved memories into consistent/inconsistent. Inconsistent memories get a durable annotation written back: self.memory[i]["lesson"] = reasoning_chain (line 407). On the NEXT retrieval those lessons are surfaced under a "[CRITICAL WARNING] ... AVOID the operations that previously led to failure" negative-exemplar header (lines 430-438). So a retrieved memory flagged bad DOES cause a state update + steers future prompts = a genuine learn-from-failure loop. Signal is ORACLE-FREE: check_consistency never sees the gold answer/benchmark reward/label — anomaly = cross-memory disagreement (LLM-judge) or off-dominant-cluster (DBSCAN). TRANSFERABLE to a session host (self-reported / cross-memory consensus, no ground-truth oracle needed). BUT three shipped-code caveats downgrade it to PARTIAL: (1) both run loops do `from consistency import check_consistency` yet neither consistency.py defines check_consistency (only the ConsistencyChecker CLASS) — the shipped defense path ImportErrors as-is; same "shipped repo dropped/renamed the mechanism" class as ReMe. (2) The lesson write-back is in-memory only — no json.dump/pickle of the annotated memory to disk; lessons persist across episodes within one process run but NOT across runs. (3) The lesson mechanism exists ONLY in EhrAgent; ReAct/local_wikienv.py:332-337 only FILTERS (drops inconsistent memories from the turn), no write-back, no lesson. NOVEL signal type vs the known portfolio: group-consensus anomaly detection (cross-memory reasoning-chain agreement, no oracle) — not in {tool-result, /goal, user-correction, cmk-forget, recall-miss, used-vs-ignored, contradiction, recurrence}. Framed as a poisoning defense, not a utility learner, but the loop shape is learn-from-failure.

**Why:** Fixes the denominator on the "does an agent-memory system learn from failure?" survey — A-MemGuard was triaged claims-yes; code-level read confirms a real (partial) learn-from-failure loop with an oracle-free, transferable consensus signal, plus a novel signal type (group-consensus anomaly) worth adding to the portfolio.

**How to apply:** When comparing to the kit's own trust_score loop: A-MemGuard's consensus/lesson pattern is the closest external precedent for an oracle-free write-back that steers FUTURE retrieval (negative-exemplar injection), which the kit's dampen-but-not-in-ranking loop currently lacks. Treat the code caveats (missing check_consistency def, in-memory-only lessons, EhrAgent-only) as evidence it is a research prototype, not production — cite CODE level, verdict PARTIAL not YES.
