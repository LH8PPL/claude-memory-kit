---
id: P-aZD9T5XX
type: project
shape: State
title: Cut-Gate Guides Updated for v0.5.4 Rename
created_at: 2026-07-15T07:19:18Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0ea70a4a329724007fb4f0d25ad76bce33aac691dbcaf694b3f98771ac1f3fbd
related: [v0-5-4-released-under-renamed-repo-identity, persona-directory-moved-to-core-memory-kit, version-0-5-4-tarball-ready-for-gate-testing]
---

All 4 cut-gate guides (base, cursor, kiro, kiro-cli) updated for v0.5.4 rename:
- Config path: ~/.claude-memory-kit → ~/.core-memory-kit
- npm package: @lh8ppl/claude-memory-kit → @lh8ppl/core-memory-kit
- CLAUDE.md marker: claude-memory-kit:start → core-memory-kit:start
- v0.5.4 banner added (uninstall-old-first flow); checkout path C:\Projects\claude-memory-kit preserved

**Why:** Guides are user-facing verification steps and must reflect new naming for v0.5.4; uninstall-old-first is cut-specific

**How to apply:** Reference guides during v0.5.4 cut testing; verify users follow uninstall-old-first during installation
