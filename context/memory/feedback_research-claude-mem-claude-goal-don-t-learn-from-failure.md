---
id: P-ZUWNNNaH
type: feedback
title: 'Research: claude-mem + claude-goal don''t learn from failure'
created_at: 2026-07-01T15:29:34Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: 09b0fa29de4baae1eb2ee34a107aafec4469f4939140cca67538ce83b1e2cdf8
related: [evo-memory-survey-passive-benchmark-oracle-discards-failure, a-memguard-consensus-driven-lesson-memory-learn-from-failure, skillrevise-learns-from-failure-only-via-a-per-task-test-ora]
---

Adversarial code-level research (2026-07-01) on two U-Mem-adjacent systems, for the "does anyone ship an outcome/failure signal" question:

claude-mem (thedotmack, our closest SQLite+FTS5 analog): STORE-AND-RETRIEVE ONLY. SQLite schema (src/services/sqlite/schema.sql) `observations` table has NO utility/score/trust/reward/access-count column — only text/type/facts/narrative/discovery_tokens (a COST metric, not outcome). Extraction prompt (src/server/generation/providers/shared/prompt-builder.ts) says "summarize durable, useful discoveries"; types = discovery|progress|blocker|decision (blocker is a stored TYPE, not a signal a retrieved memory was bad). Retrieval (src/services/sqlite/SessionSearch.ts) ranks ONLY by `ftsTable.rank ASC` (FTS5 bm25) or `created_at_epoch DESC` (recency) — never outcome-weighted. The only post-creation `UPDATE observations` statements are `SET project=?` / `SET merged_into_project=?` (worktree reproject plumbing) — nothing touches quality on retrieval. No feedback loop, no pruning-on-failure, no corrective-memory creation. evals/swebench measures whether memory helps overall — but that's an OFFLINE benchmark of the tool, not a runtime per-memory signal.

claude-goal (jthack, closest thing to a Claude-Code-host outcome signal): NOT a memory system + does NOT learn from failure. Stop-hook goal loop (goal/scripts/claude_goal.py) keeps the model working until goal complete. STATUSES = {active, paused, budget_limited, complete} — THERE IS NO `fail` STATE. A goal is only ever self-marked `complete` by the model after an LLM self-audit (a prompt: "completion audit against actual current state"), or cleared/paused. No PASS/FAIL outcome, no failure branch, nothing consumes an outcome. events table is read exactly ONCE — to COUNT `stop_continue` events for a 500-continuation runaway guard (loop throttling, not learning). Zero grep hits for memory/lesson/learn/corrective/retry across the whole repo.

Verdict for both: PASSIVE side of U-Mem Fig 1. The prior "nobody ships a usage/outcome signal" claim is VERIFIED for these two at CODE level (not README-level). claude-goal's self-audit is an LLM-judge on the CURRENT session's artifacts (not a stored reward, not ground-truth, not transferable as a benchmark reward).</text>
<parameter name="type">reference

**Why:** Answers the two driving research questions (Q1 learn-from-failure? Q2 what signal?) for the claude-mem + claude-goal target with primary-source code evidence, so the "learning from failure is the one missing organ" thesis is backed by facts, not impressions.

**How to apply:** When evaluating whether to build a failure-learning organ, cite these as code-verified PASSIVE-only precedents. claude-goal's completion-audit prompt is the closest Claude-Code-host outcome pattern (LLM self-judge on session artifacts) — but it's per-session, not stored, and has no FAIL branch, so it is NOT a transferable reward signal.
