---
id: P-MC2UDaUT
type: project
shape: Timeless
title: Claude Code Window-Close Leaves Zombie claude.exe Processes
created_at: 2026-07-27T19:09:10Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 1a74fb67d1285f7c4ef22ed953689761ee535bf4b879e4f543e6dec488055f2e
related: [kiro-cli-spawns-mcp-in-cmd-exe-wrapper-claude-code-spawns-he, windows-dll-locking-during-cmk-reinstall, stale-mcp-process-workaround-after-build-updates]
---

When closing a Claude Code window in VS Code, the `claude.exe` session process may not terminate properly, leaving a zombie with child MCP server processes still running.

- Signature: Process tree shows defunct claude.exe as root with child cmk mcp serve processes
- The kit's MCP server lifecycle is correct: processes spawn as children and exit when parent dies
- The kit is not at fault; this is Claude Code's (Anthropic's VS Code extension) lifecycle bug
- Impact: Can consume 400+ MB per orphaned window; memory is reclaimed only after manual cleanup

**Why:** Future debugging sessions need to distinguish this known Claude Code pattern from kit issues. Knowing the signature helps rapid diagnosis.

**How to apply:** If you see cmk mcp serve processes with a defunct parent, check if root is claude.exe; if so, manually kill the tree; consider reporting to Claude Code repo with your repro story
