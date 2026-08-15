---
id: P-SR5PGR3C
type: reference
title: SkillRevise learns from failure only via a per-task test oracle
created_at: 2026-07-01T20:19:30Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: 8d0ef947be181f53d59e53f6dfbafbe667516aa4c14b25f018f23ad291a3bd0a
related: [skillrevise-earns-better-skill-via-benchmark-verifier-oracle, evo-memory-survey-passive-benchmark-oracle-discards-failure, a-memguard-consensus-driven-lesson-memory-learn-from-failure]
---

SkillRevise (arXiv 2606.01139, HKUST-KnowComp) is ORACLE-GATED and NOT transferable to a session host as a learn-from-failure signal. The "verifier" that decides skill pass/fail is a per-task test harness ("a verifier entrypoint under tests/") copied from the benchmark bundle — pass/fail assertions, output paths, schemas, terminal sentinels. Selection is succ(S,T)=1 (verifier-passing); ri is "the outcome score or pass/fail reward". Empirical utility U(S,T) is oracle-gated (gsucc=1[succ=1]) AND used only as a tie-breaker among FAILED candidates when none pass — an inert-until-fallback utility, not a ranking signal. The cross-task Principle Memory (7 seed principles) is FROZEN by default: "online absorption is not used to improve later test tasks unless explicitly stated." So the memory layer is passive across tasks; only within-episode revision learns, and it learns from a ground-truth test oracle. Limitations section states outright: "SKILLREVISE depends on verifier-visible feedback... Our evaluation is also limited to verifier-based benchmarks." No novel oracle-free signal type. Wave-2 verdict: learns-from-failure = partial (within-episode only), needs benchmark oracle = yes.

**Why:** The research loop's decisive discriminator is whether a system's failure signal needs a ground-truth oracle (benchmark reward / unit-test pass / gold label / env final-state). SkillRevise's verifier is literally a tests/ entrypoint from the benchmark — the purest oracle form — so its whole revision loop is non-transferable to cmk's oracle-free conversation setting. Recording it prevents re-reading the paper and mis-remembering it as a candidate signal source.

**How to apply:** When triaging wave-2 systems for oracle-free failure signals, treat SkillRevise as a NEGATIVE result: cite the tests/-verifier + the "verifier-based benchmarks" limitation as the disqualifier. Contrast with Memoria (oracle-free self-reported {useful/irrelevant/outdated/wrong} down-ranks the memory) — SkillRevise's utility is the inert-until-fallback anti-pattern (letta/MemOS/A-Mem family), not a live ranking signal. Its trace-conditioned diagnosis -> repair-principle retrieval is interesting mechanism but still anchored on verifier-facing failures, so no new signal type.
