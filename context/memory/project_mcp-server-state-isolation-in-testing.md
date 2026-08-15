---
id: P-4JQZL6HE
type: project
title: MCP Server State Isolation in Testing
created_at: 2026-06-24T15:02:02Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 7b49eb15ca3633c41e685ad77792289fccabcd32432b4a1d1b001f61b42f27f6
related: [stale-mcp-process-workaround-after-build-updates, stress-test-gating-rule-for-pr-approval, dj4-live-test-prerequisites]
---

Stale MCP servers from previous runs can mask test results by holding old environment state. When validating kiro-cli's delivery of mcp.json `env` to spawned processes, pre-existing server instances prevent clean testing.

**Workaround:** Kill all stale MCP servers before re-testing in a fresh project folder. This ensures the new diagnostic runs with a guaranteed-fresh MCP server spawn, isolating variables.

**Why:** Without isolation, a test result can be false-positive or false-negative due to stale env state from a prior run. Killing old servers ensures the test truly validates the current code path, not cached behavior.

**How to apply:** Before each diagnostic round, check process list for lingering MCP servers (e.g., PID 17648) and kill them. Then re-run in the fresh test folder to generate clean output.
