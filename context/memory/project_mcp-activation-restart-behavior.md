---
id: P-D4BXGYX7
type: project
shape: State
title: MCP Activation Restart Behavior
created_at: 2026-07-06T13:19:15Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 12bf23131ef23cecea5865a4747a5d2097420ed1a93ce9bb02a0e1941b227df9
related: [hc-9-drift-after-claude-code-update-v0-3-4, cmk-install-activation-and-native-memory-options, kiro-cli-mcp-trust-model-and-kit-s-workaround]
---

`cmk install` prints "Restart Claude Code to activate" (subcommands.mjs:334). This is a one-time activation restart required after install—standard MCP client behavior across Claude Code, Cursor, and Kiro. After the one activation restart, all 11 `mcp__cmk__*` tools connect reliably in every future session with zero additional restarts needed.

**Why:** Users and testers need to understand that one restart after install is expected and normal, and that subsequent sessions have no friction—this prevents confusion about whether the kit is broken or requires ongoing restarts.

**How to apply:** Frame restart requirement in docs and user messaging as "activation restart" (matching the install output message) to clarify it's standard one-time setup, not a recurring problem. When troubleshooting MCP tool unavailability, first verify the activation restart was completed.
