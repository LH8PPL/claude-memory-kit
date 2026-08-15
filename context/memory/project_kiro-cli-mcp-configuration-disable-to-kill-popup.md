---
id: P-T5SJYZVa
type: project
title: kiro-cli MCP Configuration — Disable to Kill Popup
created_at: 2026-06-24T18:05:16Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 4a7a2751f249c6cc19def0cf3a8b449667b4a928d2df1dd3007efa54efccd53f
related: [kiro-install-contains-two-independent-clients-with-separate, kiro-cli-agent-resolution-requires-global-default, disable-mcp-in-ide-wrappers-with-includemcpjson-false]
---

Set `includeMcpJson: false` in `~/.kiro/agents/cmk.json` to disable MCP server spawning in kiro-cli. This eliminates the cmd.exe popup window. The change is **scoped to kiro-cli only** — Claude Code and Kiro IDE continue using MCP (they read `.kiro/settings/mcp.json` directly, bypassing agent config).

**Why:** kiro-cli was spawning a non-functional MCP server, causing an annoying popup (issue #5873). Disabling MCP here removes dead weight while preserving MCP for other surfaces.

**How to apply:** Apply only to kiro-cli agent config. Test that popup is gone after `npm pack` + reinstall. Document that Claude Code / Kiro IDE remain unaffected.
