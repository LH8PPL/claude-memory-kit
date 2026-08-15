---
id: P-96QaCC9J
type: project
shape: State
title: Memory Tiers Contain Only Mission Context
created_at: 2026-07-20T09:49:51Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a2aede64a7e2284e1ca227b2ab917f74d9b44414ef17511ba60969f7804bf2c1
related: [memory-tiers-carry-mission-context-only-the-user-s-project-d, memory-tier-boundaries-kit-health-signals, notification-doctrine-non-actionable-repeating-failures]
---

**Rule:** Session memory must contain mission context and genuine user facts only. Kit operational issues, debugging artifacts, and tool noise do NOT go in memory.

**Enforcement (both directions):**
- **Capture:** Exclude-on-doubt filter — when unsure, treat as kit noise (recoverable via retry)
- **Reporting:** Kit-health signals only via ephemeral systemMessage (shown once, never persisted)

**Where kit issues belong:** DECISION-LOG.md, tasks.md, or ephemeral display — NOT memory tiers

**Why:** Operational noise in session memory pollutes the user's mission context every session. A failure notification in memory that loads automatically becomes a repeated nag without user action, training users to ignore that channel when it genuinely matters.

Both capture and reporting layers can pollute memory equally, so both must enforce this separation.

**How to apply:** When designing capture/reporting/persistence: classify content as mission context or kit noise. Route accordingly. In capture, treat ambiguous content as kit noise (safer than pollution; content is recoverable via retry). In reporting, show kit-health once, ephemerally only, never auto-load.
