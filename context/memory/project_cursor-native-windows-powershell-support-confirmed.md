---
id: P-WNQaPLZP
type: project
shape: State
title: Cursor Native Windows PowerShell Support Confirmed
created_at: 2026-07-05T14:31:57Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ce3beb9a486c554d2f9a99379d58ce8cfd54fab28385aaa1bdd8fdc50011f722
related: [agent-cli-validation-requires-exit-code-check-not-just-path, hc-9-drift-after-claude-code-update-v0-3-4, kiro-cli-integration-test-gate-and-reinstall]
---

Cursor ships native Windows PowerShell installer (`irm 'https://cursor.com/install?win32=true' | iex`) as of late-Jan 2026. Prior Git-Bash "ports" cited in earlier research were historical artifacts predating this native support. **Critical validation caveat:** IDE had an installer bug through May 2026 that could run the Unix installer under Git Bash; PATH presence alone is insufficient — must probe `cursor-agent --version` exit code to confirm valid installation.

**Why:** Resolves Windows-platform blocker for agent support; confirms native Windows CLI path exists and is canonical

**How to apply:** Kit's Cursor backend should check `cursor-agent --version` exit code, not just check PATH presence; treat valid exit code as confirmation of headless capability
