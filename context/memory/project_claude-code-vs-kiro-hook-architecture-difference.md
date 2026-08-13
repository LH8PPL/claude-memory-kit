---
id: P-9RFHM2Q2
type: project
shape: Timeless
title: Claude Code vs. Kiro Hook Architecture Difference
created_at: 2026-07-06T15:09:30Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 9306debc57954a2fdc36195d84b39e5651e28581746abca7cb128c313ef39aff
related: [hook-architecture-differs-across-claude-ai-products, kiro-cli-requires-global-chat-defaultagent-because-hooks-are, kiro-cli-agent-resolution-requires-global-default]
---

**Claude Code** — hooks (automatic scripts on session events) belong to the PROJECT:
- Kit writes hooks to `<project>/.claude/settings.json`
- Open Claude Code in the project → hooks fire automatically
- No "which agent?" selection needed; project files alone trigger execution

**Kiro** — hooks can ONLY belong to an AGENT (a named config like `cmk`):
- No equivalent project-level hook file
- Hook fires only when that agent is the active agent
- To trigger hooks automatically without user action, the agent must be set as the **global machine-wide default**
- Kiro has no per-project default-agent setting

**Consequence:** Kit's design differs between environments because the two CLIs have fundamentally different hook-scoping models. Kiro's architecture forces global defaults; the kit cannot replicate Claude Code's per-project behavior.

**Why:** This architectural difference explains why the kit recommends different setup paths for each environment and why it cannot provide "project-local" automatic memory activation in Kiro. It is not a workaround choice but a hard constraint of Kiro's design.

**How to apply:** Use this to clarify why kit setup differs across Claude Code vs. Kiro when debugging or explaining. When evaluating new IDE support, check whether it has project-level hook/settings files (like Claude Code) or whether hooks are agent-scoped (like Kiro)—this distinction determines how the kit can auto-activate memory.
