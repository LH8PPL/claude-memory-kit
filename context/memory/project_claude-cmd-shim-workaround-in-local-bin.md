---
id: P-FTWRHF7H
type: project
title: Claude.cmd Shim Workaround in .local/bin
created_at: 2026-06-27T21:08:34Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: cfe03ce26c20a2a153ff9b941b165058d561153e95d9d8dcd33f8d9b2677440d
related: [global-cli-rebuild-and-reinstall-workflow, design-contract-enforcement-via-tests-code, global-cmk-artifact-version-and-template-sync]
---

A `claude.cmd` shim was created in `.local/bin` that forwards to the working Claude Code native binary. Purpose: tests and scripts calling `claude.cmd` will resolve to the working install even after the broken npm-global copy is uninstalled.
- Shim: 2-line forwarder script
- Location: `.local/bin` (first on PATH, so it takes precedence)
- Reversible: can be deleted if setup changes
- Why it works: `.local/bin` is checked before the global npm bin directory

**Why:** The broken @anthropic-ai/claude-code npm global install was being found by `claude.cmd` calls in tests. Uninstalling it alone would break `claude.cmd`. The shim ensures continuity without re-installing via npm.

**How to apply:** Recognize this shim as a forward-compatibility bridge. It will handle all `claude.cmd` calls transparently. No manual intervention needed unless reverting the setup.
