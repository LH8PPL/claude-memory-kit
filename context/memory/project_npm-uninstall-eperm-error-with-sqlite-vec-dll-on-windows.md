---
id: P-9RRaRPE5
type: project
title: npm Uninstall EPERM Error with sqlite-vec DLL on Windows
created_at: 2026-06-26T15:37:48Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 8ea9f9f63dde4f3ad760f1dc3c8bf7590c5b0198d88e1699474d8cd59dee8eda
related: [windows-dll-lock-blocks-npm-reinstall-better-sqlite3-node, npm-uninstall-ebusy-error-with-better-sqlite3-node-on-rebuil, close-claude-code-before-global-cmk-install-to-avoid-ebusy]
---

During `npm uninstall -g`, cleanup may fail with EPERM on the sqlite-vec-windows-x64\vec0.dll binary if a process (Claude Code IDE, MCP server, or other tools) still holds the file handle.

Error:
```
npm warn cleanup Failed to remove some directories [
  [
    'C:\\Users\\...\\node_modules\\@lh8ppl\\.claude-memory-kit-...',
    [Error: EPERM: operation not permitted, unlink '...\\vec0.dll']
  ]
]
```

**Why:** Native bindings (`.dll` files) on Windows remain locked if any process has loaded them. npm cannot unlink a locked file.

**How to apply:** If uninstall fails with EPERM, close any IDEs, Claude Code instances, or MCP sessions that may have loaded the package, then retry `npm uninstall -g`. The uninstall may partially succeed (137 packages removed) even with warnings.
