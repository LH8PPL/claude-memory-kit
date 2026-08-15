---
id: P-aQLDJM5J
type: project
shape: Timeless
title: MCP Prompt Root Cause — Agent Config & kiro-cli Mismatch
created_at: 2026-07-06T18:15:20Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: fc1d646a6cd1d6f63b4591376934f43e210d65e92a501749bb61b277f8e70cf7
related: [mcp-prompt-gate-only-appears-in-non-default-agent-scenario, kiro-cli-mcp-trust-model-and-kit-s-workaround, task-165a-is-design-decision-linked-to-d-285-not-mechanical]
---

**cmk agent config:** `includeMcpJson: false`, no `allowedTools` (deliberate D-198 choice to use pre-trusted shell commands, never MCP)
**kiro_default path:** loads project `mcp.json`, reaches for `mk_remember` (MCP call)
**Gap:** kiro-cli doesn't honor `mcp.json`'s `autoApprove` trust config → MCP approval prompt appears one time per session
**Root cause:** mechanism split between active agent's config (cmk) and what kiro_default loads (project mcp.json)

**Why:** Clarifies why the prompt appears on kiro_default but not with global default (cmk active). Confirms it's a config gap, not a system failure.

**How to apply:** When MCP prompts appear on kiro_default, check if kiro-cli is reading agent config vs project mcp.json; applies to all fix options (add allowedTools to cmk agent, document one-click approval, or split in docs/KIRO.md).
