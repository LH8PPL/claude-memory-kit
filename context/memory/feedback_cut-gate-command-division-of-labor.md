---
id: P-NA6ZC4SD
type: feedback
title: cut-gate-command-division-of-labor
created_at: 2026-06-21T15:03:39Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 0742619ce2243613c995ebc968c93f2b6582c3682e807f63a3fde51f986b6200
related: [test-artifacts-can-contaminate-fresh-install-testing, use-mcp-mk-remember-not-bash-cli, kiro-skills-map-nearly-1-1-to-claude-code-skills-verified-fr]
---

During cut-gate / live-test runs, the assistant runs the boring read-only verification commands itself (dir, type, Test-Path, Get-Content, cmk search, file reads); the user only runs the commands that need their real machine's live app — the Kiro IDE GUI sessions, kiro-cli chat, creating hooks in the GUI, the destructive backup/restore, tag pushes.

**Why:** The user explicitly said 'next time we do a test, you run the boring commands' — verification reads are the assistant's job; only genuinely-interactive or machine-specific live steps are the user's.

**How to apply:** Use the Bash/PowerShell tools to run dir/type/Test-Path/Get-Content/cmk-search/file-inspection during a gate; hand the user only: live Kiro IDE/kiro-cli sessions, GUI hook creation, backup/restore of real dirs, npm publish / git tag push (their outward actions).
