---
id: P-6C9TDAMU
type: project
shape: State
title: Cursor Agent Automation Requires Separate CURSOR_API_KEY (No Desktop Login Reuse)
created_at: 2026-07-05T14:31:57Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c1aa73fdca8c742ecc93e4144e31d58aa275f0d2db8461edcb64aba7ace0b14d
related: [kiro-configuration-structure-agents-md-not-claude, documentation-structure-and-prerequisite-locations, cmk-disable-semantic-environment-variable]
---

`cursor-agent` CLI in headless scenarios requires explicit `CURSOR_API_KEY` environment variable; it does NOT reuse desktop IDE login credentials (unlike Kiro, which reuses existing session). Missing or unset key causes silent no-op with no error.

**Why:** Onboarding trap: users may assume desktop login carries over to CLI, leading to silent failures in automation

**How to apply:** Kit's Cursor backend onboarding must include explicit step to generate (via Cursor dashboard) and set `CURSOR_API_KEY` env var; document this as separate from IDE login setup
