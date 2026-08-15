---
id: P-SXSPGGEC
type: project
title: Kiro-CLI Agent `tools` Field Configuration Fix
created_at: 2026-06-24T19:32:23Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 3646bdd23928b86751f2f447120e4553c97adc5c2af3cc1a7cad194c5f5c0337
related: [tool-execution-in-kiro-cli-requires-tools-config, missing-tools-field-was-the-shell-blocker, agent-definitions-load-at-session-start-not-invokable-in-tha]
---

The kiro-cli agent lacked a `tools` field in its configuration, preventing the model from invoking shell commands. Adding `tools: ['*']` enabled all tool execution.

Root cause of misdiagnosed issues #5873, #5376, #7431, #4579 — these were NOT kiro framework bugs, but missing agent configuration.

Validated live in commit a60b11a.

**Why:** Agents without `tools` cannot execute tools; they can only return text and may fake success responses.

**How to apply:** When setting up new agents, include `tools: ['*']` (or specific tool list) in agent config. When debugging tool invocation failures, check this field first.
