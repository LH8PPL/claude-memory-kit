---
id: P-FYaVAJQX
type: project
shape: State
title: install-agent.mjs Non-Global Regex Allows Duplicated Managed Blocks
created_at: 2026-07-10T20:35:15Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 304d1270ea096a0e47be3324fa10c397503f4a3bcb530fd094402e3caed0412f
related: [task-220-duplicate-block-handling-design, install-system-requirements-matrix-v0-4-0, kiro-cli-memory-integration-test-procedure]
---

- **Root Cause**: `install-agent.mjs` uses non-global regex (missing `g` flag) to refresh managed blocks
- **Symptom**: When a managed block is duplicated in CLAUDE.md or `.mdc` files, only the FIRST occurrence gets refreshed on reinstall; second block survives uninstall
- **Impact**: Violates byte-preserve/clean-removal contract; leaves stale blocks after install/uninstall cycles
- **Scope**: Direct CLI install path + Cursor agents-md instruction-file leg
- **Status**: Confirmed (live-reproduced via task a8b2a8256fd49774e)
- **Severity**: Medium

**Why:** Future work on install/agents, managed block refresh, or block deduplication needs this context

**How to apply:** When fixing, ensure regex uses global flag (`g`); add test coverage for duplicated block scenarios; verify clean removal on uninstall
