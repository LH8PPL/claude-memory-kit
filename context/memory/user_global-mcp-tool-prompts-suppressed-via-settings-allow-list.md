---
id: P-QWRUYNXX
type: user
title: Global MCP Tool Prompts Suppressed via Settings Allow-List
created_at: 2026-06-16T10:01:00Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 8600c559df5ac0c11ea3a212ed89c0873d74b18ddbe7b6711f4548f30baf4710
related: [claude-code-2-1-x-mcp-wildcard-auto-approve-change, fresh-folder-verification-workflow-for-claude-memory-kit-rel, mcp-prompt-root-cause-agent-config-kiro-cli-mismatch]
---

The user's `.claude\settings.json` contains a permissions allow-list:
```json
"permissions": {
  "allow": [
    "Bash(cmk:*)",
    "Skill(memory-write)",
    "Skill(memory-search)",
    "mcp__cmk__*"
  ]
}
```

The `"mcp__cmk__*"` entry suppresses per-tool-call MCP approval prompts. The kit preserves one-time server-startup approval by design (decision P-ZFEHNQY7).

**Why:** Explains why no MCP prompts appear in practice across projects. This is a global user configuration.

**How to apply:** When setting up new cmk tools or debugging missing prompts, check .claude\settings.json. To suppress prompts for new tools, extend the allow-list with patterns like `"mcp__<tool>__*"`.
