---
id: P-DWMSXSTF
type: project
shape: State
title: Cut-gate release validation guides (per-agent)
created_at: 2026-07-06T11:00:34Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 2a5a367b10012592e6dfb57d65490cffb3d8989924a37b9aee4588376bb8391d
related: [claude-memory-kit-supports-3-ide-tool-agents, cut-gate-backend-pattern-template-4f, documentation-structure-and-prerequisite-locations]
---

- cut-gate.md (Claude agent checklist)
- cut-gate-cursor.md (Cursor agent, structurally parallel to cut-gate.md)
- cut-gate-kiro.md (Kiro agent, structurally parallel to cut-gate.md)
- cut-gate-kiro-cli.md (existing; deliberate split for terminal CLI vs IDE)

Three main guides must be structurally identical with agent-specific commands and paths. Keep CLI variant separate.

**Why:** Pre-release validation must verify each agent installs and runs correctly. Structural parity allows reviewers to spot gaps systematically.

**How to apply:** Create cut-gate-cursor.md and cut-gate-kiro.md using cut-gate.md as template; adapt all commands/paths per agent. Preserve cut-gate-kiro-cli.md as terminal-specific variant.
