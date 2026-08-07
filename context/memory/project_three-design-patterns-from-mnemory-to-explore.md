---
id: P-ZZ2RGKYV
aliases: [P-ZZ2RGKYV]
type: project
shape: State
title: Three Design Patterns from mnemory to Explore
created_at: 2026-08-07T19:07:51Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 85013e160389fc57902c74b18e7f0fa0516d167d0307a4ca996df038e4675573
---

- **Reinforcement-on-access**: stamp `access_count`/`last_accessed_at` on every recall hit; enables smarter eviction that protects frequently-accessed facts. cmk audit log already captures access events; post-process to enable this signal.
- **Lazy TTL with restore-on-access**: check expiry at query time (no background cron job), un-decay if touched; fits ADR-0002 philosophy and avoids background job fragility (prior cron-starvation issues: D-298, D-424).
- **LoCoMo harness**: mnemory publishes benchmark scores (73.2); adopt a similar quality harness to enable objective measurement and compose with Task 262's benchmarking sub-task.

**Why:** mnemory research surfaced mature architectural patterns addressing cmk's eviction, TTL strategy, and quality-measurement gaps. Lazy TTL especially deserves weight given cron-starvation history.

**How to apply:** Reference when designing TTL/eviction strategy or Task 262 benchmarking work. Prioritize lazy TTL designs over background-job approaches.
