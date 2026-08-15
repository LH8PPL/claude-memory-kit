---
id: P-9APUUDZY
type: project
title: kiro-cli MCP Server Source Consolidation Strategy
created_at: 2026-06-24T14:17:31Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 4e91da6d6507b875df0ca6ac35dd325e63225ee6333b6664a5f0a5d64b9e0580
related: [mk-remember-fix-self-review-agent-config-inline-mcp-composit, kiro-cli-mcp-list-reveals-agent-server-link-broken-includemc, kiro-cli-project-workaround-for-project-path-passing]
---

kiro-cli has two potential MCP server sources: the agent's global config (`~/.kiro/agents/cmk.json` with inline `mcpServers.cmk` entry) and the project's settings (`~/.kiro/settings/mcp.json`). Current ambiguity: docs do not specify which kiro-cli uses. This is dangerous because:

- Project mcp.json has `env.CMK_PROJECT_DIR` baked in (the mk_remember routing fix)
- Agent config entry lacks the env → if kiro uses it instead, routing fails silently
- Silent failures caused the data-loss bug the live test surfaced

**Recommended fix:** Remove `mcpServers` from agent-config and set `includeMcpJson: true` to force kiro to use project mcp.json (single authoritative source).

**Why:** Ambiguous MCP source selection creates composition bugs that static tests cannot detect. Only live integration testing caught the silent data-loss risk. Consolidating eliminates ambiguity and makes the system predictable.

**How to apply:** Before the live kiro-cli recall test, implement consolidation (Option B) so the test validates the fix without hitting a second source-precedence issue.
