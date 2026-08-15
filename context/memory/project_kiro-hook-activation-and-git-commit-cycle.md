---
id: P-RZR74Pa2
type: project
title: Kiro Hook Activation and Git Commit Cycle
created_at: 2026-06-21T06:48:23Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: c373a683431940017f3c43e125eb5e2e9ce8f6a6ccdbf0066c19f2b6403af5ac
related: [kiro-cmk-setup-checklist-pre-session-1, claude-code-hook-activation-requires-restart, kiro-requires-full-restart-to-load-updated-hooks]
---

Kiro hooks require a Git commit + Kiro restart to become active:
- Hook config files in `.kiro/hooks/` must be committed to Git
- Changes are not reflected until Kiro is restarted after the commit
- `runCommand` exit code 0 = stdout flows to agent context; non-zero = blocks that turn
- `agentStop` event trigger fires at turn end for transcript capture

**Why:** This is the documented Kiro lifecycle. Hooks are not hot-reloaded; the cycle is part of the system design.

**How to apply:** After writing IDE hook files or modifying hook configs, commit them and restart Kiro before testing. Plan hook testing around this commit+restart requirement.
