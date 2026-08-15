---
id: P-SRJWSPEY
type: project
shape: State
title: Kiro CLI Requires Global chat.defaultAgent Because Hooks Are Agent-Scoped
created_at: 2026-07-06T15:01:23Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a802a0c54184e6cfba35c8e9dc233721be16e236358a0960cde5f28af88b9241
related: [hook-architecture-differs-across-claude-ai-products, kiro-cli-agent-resolution-requires-global-default, claude-code-vs-kiro-hook-architecture-difference]
---

Kiro CLI stores hooks inside individual agent configs (~/.kiro/agents/<agent>/config → hooks{}), not at project level. Hooks only fire when the agent is active.

To enable automatic memory without requiring --agent flag each session, chat.defaultAgent must be set globally to the memory-kit agent.

This creates a cascading requirement: hooks in agent scope → agent must be default → default setting is global-only → agent must be global.

Verified universal across shipping Kiro memory tools (2026-06-20 research).

**Why:** Explains why claude-memory-kit's Kiro implementation requires a global agent; this is a structural constraint, not a design choice

**How to apply:** When working with Kiro memory features, assume no project-level hook file exists; all hooks must be agent-scoped and gated by default-agent settings
