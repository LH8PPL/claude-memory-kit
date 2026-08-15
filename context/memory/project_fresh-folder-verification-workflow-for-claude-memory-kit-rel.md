---
id: P-DEaC6AAS
type: project
title: Fresh Folder Verification Workflow for claude-memory-kit Releases
created_at: 2026-06-27T07:07:52Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 42ed1ae240b57ea8580abb9e7a933dac7aefa49fe4baa663b2dbe2fb4d1124a4
related: [live-test-workflow-for-kiro-cli-project-fix, re-pack-verify-workflow-for-cut-gate-testing, cmk-fix-verification-workflow-fresh-folder-v0-4-1]
---

1. Re-pack the fixed cmk: `cd C:\Projects\claude-memory-kit && git pull && cd packages\cli && npm pack && npm install -g .\<pkg>.tgz`
2. Create fresh test folder: `mkdir C:\Temp\cut-gate-v0X && cd C:\Temp\cut-gate-v0X && git init`
3. Run install with semantic: `cmk install --with-semantic`
4. Verify settings.json: check it contains 11 mcp__cmk__* entries for all tools
5. Live test: open in Code, then call mk_remember directly; expect it to run **prompt-free** (no Skill dialog, no per-tool MCP dialog)
6. One-time workspace-trust dialog is expected and correct; accept it once. Per-tool "proceed with mcp__cmk__*?" dialogs should NOT appear after fixes.

**Why:** End-to-end verification that all three v0.4.1 fixes work together (Skill form, npm exit, MCP wildcards). Unit tests can't catch these; only live prompts will.

**How to apply:** Run this workflow before declaring any new CMK release stable.
