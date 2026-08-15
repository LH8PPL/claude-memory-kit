---
id: P-aYB2XXRD
type: project
shape: Timeless
title: Kiro-cli Agent Resolution Requires Global Default
created_at: 2026-07-06T14:59:35Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 39f8ce0782f750335b873387a16fe10846d96abbb65628d1edc51a1c2e9d78de
related: [kiro-cli-requires-global-chat-defaultagent-because-hooks-are, kiro-agent-must-be-global-empirically-validated, claude-code-vs-kiro-hook-architecture-difference]
---

Kiro-cli reads agents from both global (`~/.kiro/agents/`) and project-local locations. However, `chat.defaultAgent` (auto-activation setting) is global-only in kiro.dev scope. Therefore, cmk must use global agent config + global default, not project-local setup like Claude Code.

**Why:** Architectural constraint from kiro-cli's Amazon-Q lineage. Explains why kiro-cli cannot match Claude Code's project-local agent pattern.

**How to apply:** When installing cmk for kiro-cli, wire `~/.kiro/agents/cmk.json` and set as global default. This topology is required and permanent.
