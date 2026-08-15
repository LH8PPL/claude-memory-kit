---
id: P-QEB69SP6
type: project
shape: State
title: Kiro Install Contains Two Independent Clients with Separate Hook Systems
created_at: 2026-07-09T14:52:24Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: af7c6970ccdea55c767543928d3fd0d649fcd959d8c2628a5ef76d0b23f844e9
related: [cut-gate-kiro-deliberately-tests-both-kiro-clients-across-th, kiro-ide-and-kiro-cli-have-different-hook-architectures, kiro-cli-mcp-configuration-disable-to-kill-popup]
---

- **Kiro IDE** (GUI) — hooks defined in `.kiro/hooks/*.json` (Stop, UserPromptSubmit, PreToolUse, PostToolUse)
- **kiro-cli** (terminal) — hooks defined in `~/.kiro/agents/cmk.json` (agentSpawn, stop) + default-agent registration
- A single `cmk install --ide kiro` command wires both clients, but they operate independently with different hook mechanisms.

**Why:** Both clients are installed and available; they must be tested separately because a bug or feature that works in one may not work in the other. Default-agent resolution (D-182) is an example of a CLI-only issue.

**How to apply:** When designing workflows or test plans involving kiro, remember that the IDE and CLI are two surfaces. Any comprehensive testing must include both. If only one client is installed, that is a valid limitation to document.
