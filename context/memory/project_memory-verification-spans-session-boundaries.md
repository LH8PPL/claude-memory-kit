---
id: P-4QXKKTB2
type: project
shape: Relationship
title: Memory Verification Spans Session Boundaries
created_at: 2026-07-08T11:20:08Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 2ac0bf581f434ca0d0473637a21913b9a2a48fb42e090d7dfcdbee30d79b07fa
related: [memory-kit-loop-system-tasks-190-193, autonomous-loop-catches-failures-not-successes, verify-the-autonomous-loop-not-just-the-human-correction-pat]
---

Autonomous memories verify across sessions:
- Write memory + register PREDICTION (this session)
- Tool resolves prediction (HIT/MISS/REVERSAL)
- Memory is recalled next session; outcome feeds back (silent help or dampening)

Stop-hook JUDGE (Task 192) closes within-session failures. Task 194 (v0.5.1) wires cross-session dampening into recall ranking.

**Why:** Cross-session model is the design intent (ADR-0017), not a fallback—it matches how knowledge validates in practice.

**How to apply:** Plan autonomous workflows expecting delayed verification. Use PREDICTION: lines for testable expectations; let next session's recall-and-outcome confirm.
