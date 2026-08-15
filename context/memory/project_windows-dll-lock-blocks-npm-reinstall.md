---
id: P-WLS65XPS
type: project
shape: Timeless
title: Windows DLL Lock Blocks npm Reinstall
created_at: 2026-07-07T18:28:44Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 898c8669f461b82f884d357f6fdfdf55732e3133a6a7e7323dcbed43d460834d
related: [ebusy-workaround-for-global-package-reinstalls-native-bindin, ebusy-during-cmk-upgrade-stale-process-diagnosis, close-claude-code-before-global-cmk-install-to-avoid-ebusy]
---

On Windows, native binding DLLs (e.g., sqlite) are locked by running processes (e.g., MCP servers). This prevents npm install/reinstall, causing EBUSY errors. Workaround: stop all MCP server processes before reinstalling. They will reconnect automatically on the next tool call.

**Why:** Windows locks in-use files; npm cannot replace them while processes hold them.

**How to apply:** Before npm reinstall on Windows, kill MCP servers. They auto-reconnect on next tool invocation.
