---
id: P-C3RVE6LD
type: project
title: Node-Direct Process Spawning To Prevent Cmd.exe Windows
created_at: 2026-06-24T10:30:25Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 5a220452678c049cd0652062da1c9db36db4f57a96b2b4498fadb7f69c8ebc1c
related: [kiro-cli-mcp-registration-configuration-gap, kiro-cli-mcp-popup-is-6th-cross-agent-instance-mcp-command-n, kiro-cli-popup-fix-is-task81-node-direct-windowshide-pattern]
---

Established pattern (Task 81, D-190) for avoiding persistent cmd.exe windows on Windows:
- Use `process.execPath` + path to `.mjs` file (instead of shim commands like `cmk`)
- Add `windowsHide: true` in spawn options
- Path resolution already available: `resolveCompressLazyPath` (uses `import.meta.url → ../bin/<x>.mjs`)

Fixes both detached-child spawns (lazy-compress) and MCP server registrations. Already applied successfully in Claude Code (both CLI and MCP).

**Why:** Cmd.exe wrappers create visible persistent windows on Windows, breaking UX—especially critical for CLI tools. Claude Code success validates the approach.

**How to apply:** When configuring process spawns or MCP commands, check for shim usage (`command: 'cmk'` style)—convert to node-direct using this pattern. Verify functionality (e.g., `mk_search` / memory) still works post-fix.
