---
id: P-R3MK9NAL
type: project
shape: State
title: Failure-Driven Whisper + Skill Architecture with Required Amendments
created_at: 2026-07-22T13:53:14Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: d8f59b3c6aa35ba5d27b7c0e7cff7273b4594cdf9a520543aa299e2e2a618e8e
related: [actionable-failure-threshold-for-whisper-triggers, notification-doctrine-non-actionable-repeating-failures, stress-test-gating-rule-for-pr-approval]
---

**Design**: automated whisper (hooks-layer detection) surfaces diagnostic guidance via skill when failures occur.

**Two amendments required before implementation**:
- Self-heal-first scoping: auto-fix what's safe (recovery); whisper only for judgment-call failures (missing CLI, broken registration, reinstall decisions). Aligns with prior Task 248 decision against "doctor performs the fix."
- Noise threshold: only trigger on actionable failures (repeated, or failed-then-fixed pattern), never on transient jitter (e.g., single Haiku timeout). Prevents alert fatigue.

**Principle**: signal (event) = state; cannot nag, cannot go stale. Aligns with kit's event-not-schedule pattern and fail-open posture.

**Why:** Addresses blind spot where task was "all report" without self-healing. Should be consistent with user's prior argument on Task 248. Noise threshold keeps whisper from being a nuisance.

**How to apply:** Grill should validate both amendments into the frame before Task 250 implementation. Implement actionable-failure check (repeated OR failed+fixed) in whisper trigger logic.
