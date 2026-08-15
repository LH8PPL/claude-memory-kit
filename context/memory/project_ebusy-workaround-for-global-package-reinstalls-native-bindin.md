---
id: P-VJL254MX
type: project
title: EBUSY Workaround for Global Package Reinstalls (Native Bindings)
created_at: 2026-06-21T17:08:32Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: d186fb0f6ea134ca91993ac9931fb89580fc0a2a2bf2518137c4c84bd4cb50ea
related: [rebuilding-the-global-cmk-binary-after-code-changes, cli-installation-verification-workflow, artifact-rebuild-for-v0-4-0]
---

When reinstalling `@lh8ppl/claude-memory-kit` globally after merging changes, lingering `cmk mcp serve` processes lock `better_sqlite3.node`, causing EBUSY errors during npm operations.

**Workaround (run before npm operations):**
```powershell
Get-Process node -EA SilentlyContinue | Where-Object { $_.Path -like "*claude-memory-kit*" } | Stop-Process -Force -EA SilentlyContinue
```

Then proceed with rebuild:
```powershell
cd C:\Projects\claude-memory-kit\packages\cli
npm pack
npm uninstall -g @lh8ppl/claude-memory-kit
npm install -g .\lh8ppl-claude-memory-kit-0.4.0.tgz
```

**Why:** Windows prevents overwriting files held open by processes; native Node bindings remain locked by running interpreters even after a process "exits" if the shared object is still referenced

**How to apply:** Always kill lingering node processes (especially MCP servers) before rebuilding/reinstalling global packages with native bindings; use the filter to safely target only this project's processes
