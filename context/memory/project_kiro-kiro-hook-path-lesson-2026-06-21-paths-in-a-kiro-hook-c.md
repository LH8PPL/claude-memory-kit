---
id: P-CW9CLD2a
type: project
title: 'Kiro .kiro.hook path lesson (2026-06-21): paths in a .kiro.hook command string m'
created_at: 2026-06-21T04:37:34Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: f4f302373ca40c8b1d837926c9e6559f9059b284c686e965dd04a6d803fd5021
related: [windows-kiro-hooks-execute-via-wsl-require-cmd-exe-c-prefix, critical-kiro-on-windows-hook-constraint-live-discovered-202, solved-the-windows-kiro-hook-command-form-live-verified-2026]
---

Kiro .kiro.hook path lesson (2026-06-21): paths in a .kiro.hook command string must use FORWARD SLASHES (C:/tmp/x), not backslashes — backslashes are JSON escape chars, so C:\tmp in a hand-written hook is a JSON-syntax error Kiro rejects ('Bad escaped character in JSON'). cmd.exe accepts forward slashes fine. The kit's kiro-ide-hooks.mjs writer is SAFE (it uses JSON.stringify + the command 'cmd.exe /c cmk hook stop' has no path/backslash), but if any future Kiro file embeds a filesystem path, use forward slashes or double-escape. Generate .kiro.hook files with JSON.stringify, never string concatenation.

**Why:** A hand-written probe hook with C:\tmp\... single-backslashed broke Kiro's JSON parser. The kit must never emit a backslash path into a .kiro.hook. JSON.stringify + forward-slash paths is the safe pattern.

**How to apply:** kiro-ide-hooks.mjs already uses JSON.stringify (safe). Any future Kiro file writer: forward-slash paths, JSON.stringify only. The cmk hook command form has no paths so it's clean.
