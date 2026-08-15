---
id: P-ZFEHNQY7
type: project
title: First-Time MCP Server Approval in Claude Code
created_at: 2026-06-16T09:29:12Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 880f712bdb09fa1497dad5cb82588df9f160c8afce201ccf0432a1a14e85a542
related: [mcp-server-and-settings-file-organization, workspace-trust-requirement-for-claude-skills, config-directory-migration-is-critical-blocker-for-rename]
---

Project-scoped MCP servers (registered in `.mcp.json`) require one-time approval in Claude Code before their tools become available. The UI initially shows "⏸ Pending approval" status.

**Why:** Claude Code enforces this security policy on all MCP servers defined in committed config

**How to apply:** On first opening a project with registered MCP servers, expect an approval prompt. Approve it to activate the tools; this is expected behavior.
