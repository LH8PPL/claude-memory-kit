---
id: P-SYP79LTP
type: project
shape: Timeless
title: CLI Fallback for MCP Tool Resolution Failures
created_at: 2026-07-06T13:19:15Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: d2c17c1bb7290c996fdb286cc0a97d8f239b6072a760662ed85a5f98cd8d90b5
related: [kiro-cli-env-passing-limitation, d-343-kit-lacks-mechanism-to-repair-stale-scaffolded-skills, kiro-cli-agent-configuration-and-verification]
---

When MCP tools don't resolve via ToolSearch (e.g., `mcp__cmk__*` tools unavailable), the CLI fallback path works as a verified workaround. This unblocks progress when MCP connectivity is temporarily broken and allows testing/validation to continue.

**Why:** Provides an alternative path for testers and developers when tool resolution fails. Enables forward momentum even during activation troubleshooting.

**How to apply:** Use the CLI fallback when MCP tools are unavailable. Document it as a working alternative path, especially for testers/troubleshooters who may not have completed activation setup yet.
