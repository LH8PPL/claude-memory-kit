---
id: P-BGLaBTCK
type: project
shape: Plan
title: 'Task 233 (ADR-0024): Memory-search fix via evidence-bearing hints'
created_at: 2026-07-22T13:59:09Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 927445bfd3b0f80b116b33df3c88765efbe25919a41c8f80d1e86cbb363e026e
related: [kit-lacks-skill-fire-telemetry-for-measuring-recall-improvem, decisions-md-is-write-only-for-ai-recall-not-in-any-recall-d]
---

**Design (settled, ready to build):**
- Upgrade per-prompt hint from ambient "memory available" to evidence-bearing: run real FTS5 query over prompt terms
- If match clears score floor, inject up to 3 actual index lines: "here are titles matching what you asked"
- Add existence advertisement in snapshot (fact count, scopes, last write)
- In-skill refinements for when it fires

**Rationale:** Ambient schedule-based nudges are tuned out by model; specific evidence ("these facts exist") outperforms.

**Status:** No new research needed (researched 2026-07-19 trigger-architecture study + Letta deep-read). Rejected alternatives documented. Laned as v0.6.x rider, loses to other work.

**Success criterion:** Measure before/after fire rate via skill-fire logging (currently missing — kit logs recalls + extractions but not skill invocations).

**Why:** Addresses observed failure mode where memory-search fires zero times despite per-prompt hint. Root cause: ambient hints lack credibility; specific evidence restores model trust in memory layer.

**How to apply:** Pull 233 into next implementation lane (v0.6.3 suggested). Add skill-fire telemetry alongside so before/after is measured, not felt. Open research question (PreToolUse file-read trigger) already correctly deferred behind these measurements.
