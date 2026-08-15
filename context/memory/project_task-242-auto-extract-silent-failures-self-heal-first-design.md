---
id: P-X66TPQRV
type: project
shape: Plan
title: 'Task 242: Auto-Extract Silent Failures — Self-Heal-First Design'
created_at: 2026-07-20T09:45:52Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 73d600cc5ccc5afde6e4f0e6dfca4ce237316dafad98ad73f0b8f797047be861
related: [when-an-automatic-path-fails-build-a-fallback-mechanic-that, auto-extract-reliability-pattern, notification-doctrine-non-actionable-repeating-failures]
---

**Current state**: 7 of 8 turns captured nothing silently; failure modes broader than timeout alone (timeout 166/295, concurrent_run 82, haiku_failed 47, others).

**Solution (now pushed to main)**:
- Deterministic no-LLM fallback — capture user-stated durable lines even if extractor times out
- Retry on next healthy turn — failed turn's text banked in now.md, re-attempted when load drops
- Back off after N consecutive failures — stop 90s-per-turn burn that worsens load problem
- Notify last — fire exactly once on transition (healthy → degraded), silent if self-heal succeeds

**Open verification**: `concurrent_run` labelled as deferral but may silently drop turns if they're never re-extracted (82 potential silent drops hiding behind benign label).

**Why:** User correctly flagged that a repeating per-session warning about uncontrollable failures is non-actionable and burns the notification channel. The system must heal silently or the warning becomes a nag that trains users to ignore real alerts.

**How to apply:** Implement the 4-step fallback; test that notification fires exactly once on state transition (never twice); verify concurrent_run actually retries turns or mark as a done-criterion
