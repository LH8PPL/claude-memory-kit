---
id: P-Q2BJCa6D
type: project
shape: Timeless
title: CMK Install Activation and Native Memory Options
created_at: 2026-07-06T12:24:51Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 77b10a018aa61aafb5a3fd3880415f47ccdc34a66163b341970b17a796f47e31
related: [claude-code-hook-activation-requires-restart, cmk-install-scaffolding-and-wiring, hc-6-native-auto-memory-runs-alongside-kit]
---

After `cmk install` completes:
- Kit scaffolds `context/` directory and wires hooks to `.claude/settings.json`
- Output says "Restart Claude Code to activate" — restart is required for hooks to fire
- Anthropic's native Auto Memory may run alongside the kit (both accumulate over time)
- To run only kit-based memory (lean single layer), run `cmk disable-native-memory` before restart
- `--with-semantic` flag enables hybrid (keyword + semantic) search by default during install

**Why:** Users may be confused by restart requirement or uncertain whether to disable native memory; documenting these options prevents false starts and supports informed memory-architecture choices.

**How to apply:** After `cmk install`, always restart Claude Code before the first session. If you want only kit-based memory (no native parallel tracking), run `cmk disable-native-memory` before restart.
