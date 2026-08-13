---
id: P-YFTGDDA5
type: project
title: CC update does not fix MCP prompt — Task 171 validated
created_at: 2026-06-27T07:24:33Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: a44c7fc91ead8f99bf5136ec9c7e1c65cf846c2602360ed8b4d1a61557842b8c
related: [cc-2-1-x-mcp-server-wildcard-does-not-auto-approve-mcp-tools, open-cmk-mcp-per-tool-prompt-systematic-investigation-pendin, session-checkpoint-v0-4-1-cut-gate-3-fixes-merged-awaiting-c]
---

CONCLUSIVE cut-gate-v041e live test (updated Claude Code 2.1.x, pre-171 global cmk): the CC update does NOT fix the per-tool MCP permission prompt. With only mcp__cmk__* wildcard in settings.json allow-list, BOTH mk_search AND mk_remember prompted individually ("Do you want to proceed with mcp__cmk__mk_search/mk_remember?"). This validates Task 171 — the kit MUST allow-list the 11 specific mcp__cmk__<tool> names, not just the wildcard. Next: re-pack global cmk WITH 171, fresh folder, verify prompt-free.

**Why:** The user wanted to know whether the Claude Code update alone fixes the prompt-free regression before deciding if Task 171 is load-bearing. The live test answers it definitively: it does not.

**How to apply:** Re-pack + reinstall the global cmk (currently pre-171), then fresh folder + install + direct MCP capture should be prompt-free. If still prompting, escalate.
