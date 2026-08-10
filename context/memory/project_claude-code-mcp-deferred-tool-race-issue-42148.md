---
id: P-S4HKLYZS
type: project
shape: Timeless
title: 'Claude Code MCP Deferred-Tool Race (Issue #42148)'
created_at: 2026-07-06T14:00:00Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 1df2e2ed5af7bbe77049ac42e5feae02b6785a50aba86a9b25c74deb9099ad20
related: [claude-code-deferred-tools-first-turn-race-condition, cc-update-does-not-fix-mcp-prompt-task-171-validated, kiro-cli-custom-agent-tool-limitation]
---

- **Root cause:** Claude Code v2.1.x (#42148) freezes the deferred-tool list before MCP servers connect (10–30s), causing `mk_remember` to be unavailable on first ToolSearch
- **Mitigation:** The `memory-write` skill's CLI fallback is the intended recovery — it captures successfully when MCP is not yet ready
- **Scope:** This is Claude Code client-side behavior, not a kit bug; session-1 fallback is working as designed

**Why:** Explains Session-1 first-turn `mk_remember` miss; confirms fallback mitigation is working as intended, not a gate blocker

**How to apply:** Document in gate guide as "expected on fresh install; retry next turn or use CLI fallback." Do not treat as blocker. Gate M0 passes in warm session (proven—`mk_search` ran live).
