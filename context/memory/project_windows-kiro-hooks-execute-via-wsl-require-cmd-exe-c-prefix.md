---
id: P-3K6D62MS
type: project
title: Windows Kiro Hooks Execute via WSL; Require cmd.exe /c Prefix
created_at: 2026-06-21T04:26:57Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 29fbdb4bd877029b6d70ae1216e02f205f6158daf84297b360a48ef49e2342a2
related: [solved-the-windows-kiro-hook-command-form-live-verified-2026, critical-kiro-on-windows-hook-constraint-live-discovered-202, kiro-ide-hooks-live-test-wins-2026-06-21-the-user-ran-it-in]
---

On Windows, Kiro runs `.kiro.hook` commands through WSL (Windows Subsystem for Linux), not the native PowerShell/cmd shell. WSL typically lacks standard executables like `node`, `npm`, and bare `bash`.

**Consequence:** Commands that work natively fail with "not found" errors when invoked from a Kiro hook on Windows.

**Workaround:** Prefix Windows hook commands with `cmd.exe /c` to escape the WSL layer and run in the native Windows shell:
- ❌ `cmk hook stop` → "node: not found" error
- ✅ `cmd.exe /c cmk hook stop` 

macOS/Linux hooks run natively — no prefix needed.

**Why:** Discovered via live test on 2026-06-21 in Spec-Driven-Workshop. The probe `.kiro.hook` fired but failed with `node: not found`, surfacing the WSL layer. Static analysis alone would not have caught this cross-platform behavior.

**How to apply:** When authoring hook commands for the IDE integration, test in actual Kiro first. If "not found" errors appear, add `cmd.exe /c` prefix and re-test. Update the kit's `.kiro.hook` writer to emit platform-aware commands: `cmd.exe /c` prefix for Windows, none for Unix.
