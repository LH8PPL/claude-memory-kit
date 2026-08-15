---
id: P-AMDQ3MC6
aliases: [P-AMDQ3MC6]
type: project
shape: State
title: 'Task 285 Framing: Open Ground Beyond Retrieval Eval'
created_at: 2026-08-15T08:52:31Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 1c60737a294967734d6e08574358f09ff53b354f954b063182b08cfd56a6cd16
---

Task 285 scoping refined by LongMemEval findings:
- **Claimed ground**: Retrieval-stage eval (recall@k, MRR, hit@5)
- **Open ground (ours)**: End-to-end QA accuracy + lifecycle-aware recall measurement

The novel contribution: measuring whether memory systems that forget and supersede score differently than accrete-forever stores.

**Why:** Clarifies Task 285 scope and the novel measurement story; lifecycle-aware metrics differentiate our eval from prior work.

**How to apply:** Focus Task 285 effort on QA accuracy layer and lifecycle-aware recall; retrieval eval is already measured by others.
