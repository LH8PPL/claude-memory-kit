---
id: P-FRDJLURG
aliases: [P-FRDJLURG]
type: project
shape: State
title: 'LongMemEval: 962 Lines, Retrieval-Stage Implemented, QA-Accuracy Scaffold-Only'
created_at: 2026-08-15T08:52:31Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 5a310d996f55c39bc8d8b581b271b15ef79196692f83584391c4a5873af95640
---

LongMemEval contains a fully implemented retrieval-stage evaluation suite:
- **Implemented**: recall@k, MRR, hit@5, per-question-type stratification, real evidence-session ingestion through pipeline
- **Scaffold-only**: QA-accuracy layer (no answer generation or LLM-based judging)

This corrects the earlier verdict that the entire suite was scaffold-only.

**Why:** Clarifies existing eval capability and open gaps. The retrieval half is already measured; the open ground is end-to-end QA accuracy and lifecycle-aware recall (whether memory systems that forget/supersede score differently than accrete-forever stores).

**How to apply:** When extending eval infrastructure, treat retrieval evals as mature; focus effort on QA accuracy layer and novel lifecycle-aware measurements.
