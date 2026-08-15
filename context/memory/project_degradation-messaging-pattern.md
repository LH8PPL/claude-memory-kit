---
id: P-2THQQ9UU
type: project
title: Degradation Messaging Pattern
created_at: 2026-06-10T12:45:25Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: b41e9e4a42b4abb819895313058ee8807bbbcaf3
related: [standard-cmk-installation-command, windows-npm-eperm-warning-on-better-sqlite3-node-is-benign, mcp-activation-restart-behavior]
---

When a service degrades or falls back to reduced functionality, include a user-facing suggestion for recovery. Example: when mk_search falls back to keyword-only, suggest `cmk install --with-semantic` to the user. Do not degrade silently or without explanation.

**Why:** Users need to understand why behavior changed and what they can do. This is the UX standard for degradation in this project.

**How to apply:** When implementing graceful degradation, add a message explaining the fallback and suggesting the upgrade or workaround.
