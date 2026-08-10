---
id: P-GYFDaTKF
type: project
title: 'Billing Model: Subscription (No API Token Cost)'
created_at: 2026-06-25T20:14:05Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 88cf686e35879085ce95df95dcc2db4787fa111989118a0b0e04b7e2015aac91
related: [user-is-on-claude-subscription-not-api-token-billing, stress-testing-omitted-for-pure-read-cli-changes, sonarcloud-then-in-object-false-positive-schema-fields]
---

claude-memory-kit development runs on subscription billing. API calls have no marginal token cost, unlike per-API-call billing.

**Why:** Removes token cost as a gating factor when designing testing strategy. Tests can be gated on wall-clock time and rate-limits instead of cost.

**How to apply:** When deciding whether to run expensive tests (e.g., live agent-loop) in CI or pre-merge gates, prioritize speed and rate-limits over cost. Keep the shipped product's Haiku calls economical for end-users who may be on API billing.
