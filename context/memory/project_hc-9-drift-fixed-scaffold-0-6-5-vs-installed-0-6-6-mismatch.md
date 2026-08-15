---
id: P-Z32GCZT9
aliases: [P-Z32GCZT9]
type: project
shape: Event
title: HC-9 Drift Fixed — Scaffold 0.6.5 vs Installed 0.6.6 Mismatch Resolved
created_at: 2026-08-15T08:03:09Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a51316a6ae4c114ca603fe5230275bb920f94c388c0cb972d97e3b7a802e786a
related: [core-memory-kit-installed-with-claude-code-hooks]
---

- Issue: HC-9 detected version mismatch between scaffold and installed code
- Fix: `cmk install` re-synced versions; HC-9 now PASS
- Action: restart Claude Code to pick up refreshed hooks (optional; low urgency)

**Why:** Version mismatch can cause subtle issues; parity ensures stability

**How to apply:** Restart Claude Code when convenient; no urgent action needed
