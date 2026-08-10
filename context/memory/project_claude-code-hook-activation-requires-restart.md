---
id: P-CEDDPRCH
type: project
title: Claude Code Hook Activation Requires Restart
created_at: 2026-06-14T11:11:22Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 5c8dbf93befcf94632ecd974e6848c92d610cf1751e0f05a98ed51c868722d11
related: [sessionstart-hook-requires-reopen-after-install, memory-kit-hooks-are-project-scoped, kiro-requires-full-restart-to-load-updated-hooks]
---

Claude Code reads hook registrations from `.claude/settings.json` only at startup. When `cmk install` wires hooks, the hooks are registered but not activated until Claude Code is restarted. Without restart, auto-extract (Stop-hook) and other kit hooks will not fire during the session.

**Why:** Claude Code loads hook configuration once at startup and does not hot-reload `.claude/settings.json` changes.

**How to apply:** Always restart Claude Code after running `cmk install` (or any cmk command that modifies `.claude/settings.json`) before starting work. This is non-obvious and easy to miss.
