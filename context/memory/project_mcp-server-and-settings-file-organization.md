---
id: P-UBV99YJ7
type: project
title: MCP Server and Settings File Organization
created_at: 2026-06-16T09:29:12Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 6e7f5e2f7d83722cd2573a23ef40ae7668757969561fb82c9dd377c18786649e
related: [gitignore-carve-out-for-claude-agents, first-time-mcp-server-approval-in-claude-code, global-mcp-tool-prompts-suppressed-via-settings-allow-list]
---

- `.mcp.json` (project root): Registers project-scoped MCP servers; committed to git, travels with clone
- `.claude/settings.json`: Hooks, permissions, skills (project-scoped, committed)
- `~/.claude.json` (home dir): Local/private MCP servers (user-specific, not committed)

**Why:** Project-scoped tools must travel with `git clone` so all teammates get the same MCP servers, while user-specific customizations remain local

**How to apply:** When setting up project MCP configuration, expect `.mcp.json` at the project root (not in `.claude/`); MCP server permissions go in `.claude/settings.json`
