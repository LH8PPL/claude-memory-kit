---
id: P-3VT9YT6L
type: project
shape: Timeless
title: EBUSY During cmk Upgrade — Stale Process Diagnosis
created_at: 2026-07-07T13:04:20Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 6d81e2a72dca0431f6986a1f2e1a9d9feddb81d1faa3f4050ed1b12c1279975e
related: [close-claude-code-before-global-cmk-install-to-avoid-ebusy, repack-requires-cmk-mcp-process-cleanup, windows-dll-lock-blocks-npm-reinstall]
---

EBUSY errors during global cmk upgrades are typically caused by stale `cmk mcp serve` processes from the old installation still holding file locks.

**Why:** These processes prevent file replacement during upgrade. Eliminating them resolves the issue.

**How to apply:** If upgrade fails with EBUSY, identify and kill lingering `cmk mcp serve` processes from the old global before retrying the install.
