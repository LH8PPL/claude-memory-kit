---
id: P-AGSCLWSP
type: project
title: Memclaw's 6 Passive Outcome Signals (3 Already Produced)
created_at: 2026-06-29T11:05:52Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 8c23829ac2f6e71d091499b12eafab349a86a9e91e3efd76ba6592bf843b203f
related: [notification-doctrine-non-actionable-repeating-failures, task-gating-criteria-decision-blockers-and-gates]
---

Passive outcome signals identified from memclaw:
- Contradiction
- Supersession
- Repeat-recall
- Terminal-classification
- Cross-session-reuse
- Git-CI

Current capability: we already produce 3 of these 6. This unblocks Tasks 177 (train-the-doc) and 97 (dynamic trust), which were stuck waiting for a success/failure signal without violating D-169 (no explicit user prompts).

**Why:** Breaks a design blocker long-standing blocker. Passive signals are reachable without changing the core constraint.

**How to apply:** When designing signal-dependent features, check this list first. Prioritize signals we already produce; build new ones only if necessary.
