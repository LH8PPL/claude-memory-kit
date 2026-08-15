---
id: P-FLSNFR5L
type: reference
title: Memento (2508.16153) learns-from-failure survey verdict
created_at: 2026-07-01T17:31:06Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: 1ce6b2a46ece438748045a22993cedcf986b3293098c220f883ac615b8cabc6c
related: [evo-memory-survey-passive-benchmark-oracle-discards-failure, a-memguard-consensus-driven-lesson-memory-learn-from-failure, skillrevise-learns-from-failure-only-via-a-per-task-test-ora]
---

U-Mem survey — Memento (arXiv 2508.16153, github.com/Agent-on-the-Fly/Memento): learns-from-failure = YES (CODE-level). Failure signal = LLM-judge over a benchmark ground-truth answer list -> ORACLE-DEPENDENT -> NOT transferable to a session host. Three failure mechanisms confirmed in code: (1) failed trajectories written to the Case Bank as first-class case_label="negative" (parametric_memory_cbr.py:581-582; shipped memory.jsonl = 897 pos / 381 neg); (2) negative cases contrastively injected into the planner prompt ("avoid the patterns shown in negative examples", build_prompt_from_cases); (3) the neural case-retriever is RETRAINED on retrieval-outcome pairs (truth_label = did retrieving this case yield a correct final answer; save_training_data + train_memory_retriever.py CrossEntropyLoss; training_data.jsonl = 1640 true / 5360 false) — utility lives in retriever WEIGHTS, not an inert trust field. Reward = is_correct via llm_judge given data/deepresearcher.jsonl ground_truth -> benchmark-oracle in an LLM wrapper. Novel signal vs known portfolio: "failure-as-retained-contrastive-negative-exemplar" + "retrieve-by-value via separately-trained ranker" (distinct from prune-on-failure and from inert utility-field dampening).

**Why:** The learns-from-failure survey needs an honest X-of-N with CODE vs paper evidence distinguished and blunt oracle-dependence judgement. Memento is a clean YES-but-not-transferable: the mechanism (label case pos/neg by outcome, contrastive-inject, retrain ranker) is real and would port, but the reward it trains on is a gold-answer benchmark oracle a single-user session host lacks.

**How to apply:** Cite Memento in the survey's YES tier with the transferability caveat: mechanism transfers, signal doesn't (needs ground-truth). Its nearest transferable shadow is the pred-vs-reference judge template — usable only if a session host had a reference proxy (user correction / tool final-state / accepted-vs-reverted diff), which is exactly the oracle Memento assumes. Contrast with mem0/A-Mem inert utility fields (no) and MemRL tabular-Q benchmark reward (yes-but-oracle).
