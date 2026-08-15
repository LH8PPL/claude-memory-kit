---
id: P-4VT5UP5R
type: project
title: Memory Kit Hooks Are Project-Scoped
created_at: 2026-06-14T11:11:22Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 73e15e814377da8f9bd3519eebb8d95f1a6b3d795525762cb9d9ca3a21452185
related: [claude-code-hook-activation-requires-restart, sessionstart-hook-requires-reopen-after-install, diagnostic-test-statement-for-skill-capture]
---

The memory kit's hooks (Stop-hook, SessionStart-hook, etc.) fire against the currently open project directory in Claude Code. If the wrong project is open, hooks will write memory to the wrong project's `context/`.

**Why:** Hooks execute in the context of the Claude Code window that triggered them, which is tied to the open project directory. They read `.claude/settings.json` from the working directory.

**How to apply:** Ensure the correct project is open in Claude Code before starting a session. When running demos or multi-project work, verify the working directory matches the intended target.
