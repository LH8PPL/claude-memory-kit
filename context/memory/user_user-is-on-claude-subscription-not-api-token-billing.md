---
id: P-SW5R69QS
type: user
title: user is on Claude subscription not API token billing
created_at: 2026-06-25T20:13:50Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: e83c131c64b702008215c108c35cf5c0beb6e7eb175bdf846a2d081c686d4948
related: [billing-model-subscription-no-api-token-cost, task-167-testing-agent-run-unit-live-agent-loop-user-does-no, critical-kiro-on-windows-hook-constraint-live-discovered-202]
---

The user runs Claude on a SUBSCRIPTION (Max/Pro), NOT pay-per-token API billing. So driving real `claude -p` / live-agent-loop tests has NO per-call dollar cost — token 'cost' is not a reason to keep live tests out of the regular flow. (There may still be subscription RATE LIMITS / time cost, but not $-per-token.)

**Why:** The user corrected a design assumption: I justified keeping the live-verify agent-loop OUT of npm test because 'real sessions spend tokens'. On a subscription there's no per-token $ cost, so that justification is wrong. This affects how aggressively live/agentic tests + any LLM-driven kit feature can run during dev.

**How to apply:** Stop using 'token cost' as a reason to gate or skip live/agentic tests for THIS user's dev flow. The real constraints are wall-clock time + subscription rate limits, not dollars. Live tests can run more freely; the only reasons to gate them are speed/flakiness/rate-limits, not cost. (Published-kit USERS may be on API billing — keep the kit's OWN Haiku calls economical for them; this fact is about the user's DEV environment, not the shipped product's cost posture.)
