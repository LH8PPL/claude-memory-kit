---
id: P-E53ZN5BD
type: project
shape: Timeless
title: Hook Architecture Differs Across Claude AI Products
created_at: 2026-07-06T15:01:23Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: efd53001c759788eb13c471e9cffff46994ceed5d18d005936cacf218b78b343
related: [claude-code-vs-kiro-hook-architecture-difference, kiro-cli-requires-global-chat-defaultagent-because-hooks-are, kiro-cli-agent-resolution-requires-global-default]
---

**Claude Code** — hooks in .claude/settings.json (project-level), auto-fire, no agent concept

**Kiro CLI** — hooks in ~/.kiro/agents/<agent>/config (agent-scoped), only fire when agent active, agent-gated

**Cursor** — hooks in .cursor/hooks.json (project-level), auto-fire, no agent concept

Claude Code and Cursor sidestep agent-scoping via project-level hook files. Kiro CLI offers no project-level hook file; it forces agent-scoping everywhere.

**Why:** Explains why identical memory-kit design patterns do not work uniformly across products and forces different architectural choices per product

**How to apply:** Before implementing memory for a new Claude product, determine whether hooks are project-scoped (Code/Cursor pattern) or agent-scoped (Kiro pattern); design accordingly
