---
id: P-A3YUPTWL
type: project
shape: Timeless
title: Memory Tier Boundaries — Kit Health Signals
created_at: 2026-07-20T09:57:00Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 7317ce23862dbd35b64ed5f3e5036813643c1577cd1b7fdf2eecc500d65d1a2c
related: [memory-tiers-contain-only-mission-context, memory-tiers-carry-mission-context-only-the-user-s-project-d, two-host-kit-architecture-proposed]
---

Kit-operational signals (errors, timeouts, health notices, scorecard snapshots, task status) never enter memory tiers (`additionalContext`, fact storage, session tiers). When a user-facing notice is needed, it uses the ephemeral `systemMessage` display channel: shown once, not remembered. Persistent tiers carry only mission context, user decisions, and project facts.

**Why:** Keeps memory focused on user project context rather than kit-internal operations. A remembered operational notice becomes a permanent nag; operational signals belong in transient reporting channels. Prevents pollution of the tier that should carry only durable project knowledge.

**How to apply:** When routing health or error signals, use ephemeral channels. Distinguish between kit-internal tooling *mention* (e.g., "npm CI failed") as incidental vs mission-relevant facts (e.g., "watch CI on direct-to-main pushes"). Only mission-relevant facts are durable.
