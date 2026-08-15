---
id: P-AKRHWKJB
type: project
title: 'Tool Execution in kiro-cli Requires `tools: [''*'']` Config'
created_at: 2026-06-24T19:00:20Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: ab9c6a256f7ed5626e0548c24669feef614d62f7c1f46784ad44dc58d202a0f6
related: [kiro-cli-agent-tools-field-configuration-fix, global-mcp-tool-prompts-suppressed-via-settings-allow-list, missing-tools-field-was-the-shell-blocker]
---

kiro-cli agents cannot execute tool calls during chat without an explicit `tools: ['*']` field in their configuration. Without this field, tool calls are generated but silently fail to execute. The fix was a one-line config addition to grant the agent shell/system access.

**Why:** Tool execution was mysteriously failing (no error, just inert calls) because the permission gate was missing entirely — invisible until explicitly diagnosed

**How to apply:** When setting up or debugging kiro-cli projects with agent tool execution, verify the config includes `tools: ['*']` to enable inline command execution
