---
id: P-GCACVQaF
type: project
shape: State
title: MCP Approval Scope is Per-Agent, Not Project-Wide
created_at: 2026-07-06T17:59:27Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 41809305a07641b29c6a381672e3086250c5bcba3e21e83ea2cee5d049ee8386
related: [mcp-prompt-root-cause-agent-config-kiro-cli-mismatch, kiro-cli-agent-resolution-requires-global-default, cmk-agent-config-missing-allowedtools-field]
---

kiro-cli reads MCP `allowedTools` from the **active agent's config**, not the project globally. Approval prompts surface when the active agent hasn't granted permission. Prior auto-approval work targets a specific agent, not the project as a whole.

**Why:** User tested and found approval prompt despite prior auto-approval setup; analysis revealed MCP trust is read per-agent config, not globally. Prompt appeared because kiro_default (the active agent at test time) didn't have `allowedTools` configured.

**How to apply:** To ensure prompt-free MCP: either (1) set the auto-approved agent as `chat.defaultAgent` global, or (2) add `allowedTools` to every agent config that will invoke MCP tools. Project-wide approval is not possible; approval is fundamentally per-agent.
