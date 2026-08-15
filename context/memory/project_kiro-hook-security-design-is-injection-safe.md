---
id: P-aRER5PY3
type: project
title: Kiro Hook Security Design is Injection-Safe
created_at: 2026-06-21T06:48:23Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: e759a1ee52fd359ab8e0c00a48f1dcfd83401bdc3fd7226a23ed7c3710a4dce8
related: [kiro-hook-authoritative-confirmations-2026-06-21-from-the-aw, kiro-trusted-commands-auto-approve, kiro-kiro-hook-path-lesson-2026-06-21-paths-in-a-kiro-hook-c]
---

The `.kiro.hook` command and prompt-capture pipeline naturally prevents shell injection:
- Hook command is fixed (`cmd.exe /c cmk hook promptSubmit`) — no dynamic interpolation
- `USER_PROMPT` env var read **inside** Node process only (never spliced into shell command string)
- Captured content passes through Poison_Guard before file write
- This design matches AWS's recommended pattern for deterministic hook safety (prefer `runCommand` over `askAgent`)

**Why:** AWS's "Mastering Agent Hooks" article confirmed this approach is the authoritative best practice, not novel/risky. The security concern from the AWS article (sanitizing prompts) is already handled by the kit's existing infrastructure.

**How to apply:** When building orchestrator (`cmk install --ide kiro`), use the fixed hook command pattern and trust the existing Poison_Guard screening — no additional sanitization needed.
