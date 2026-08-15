---
id: P-WL7MCJVJ
type: project
shape: Relationship
title: Related Projects — Mimir, Memex (MCP-Only Memory Integrations)
created_at: 2026-07-03T21:05:08Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a5d7723dedbcea41115919e741ba9c0096241a0563847352fbe1076fba7fa255
related: [cursor-adapter-lifecycle-hooks-for-deterministic-memory-inte, kiro-cli-vs-kit-activation-pattern-design, kiro-cli-requires-global-chat-defaultagent-because-hooks-are]
---

**Mimir** (MakerViking/mimir): MCP-only; adds decision ↔ code-symbol linking and reinforcement learning (usage-based memory pruning). Overlaps with Task 176/190 learn-loop lanes.

**Memex** (STiFLeR7/memex): MCP-only; exhibits judgment-call failure (agent must decide to invoke tools).

**Key difference from our approach:** Both require agent to choose to call memory tools. Lifecycle-hooks approach is deterministic (fires at session boundaries, no choice).

**Why:** Comparative reference. Mimir's linking and reinforcement patterns relevant to project's learn-loop work. Neither was in prior research base (Task 50). Illuminates what "MCP-only" costs.

**How to apply:** Mimir worth reviewing for learn-loop design patterns (Task 176/190). Both illustrate the judgment-call failure that deterministic lifecycle hooks avoid.
