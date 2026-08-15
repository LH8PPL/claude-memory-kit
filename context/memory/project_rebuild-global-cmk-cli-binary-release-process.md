---
id: P-ZV4H36YB
type: project
title: Rebuild Global CMK CLI Binary (Release Process)
created_at: 2026-06-22T12:02:45Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 7479be6bf8753e51c664c2f29b7252b379ee9e21e82fe4f2d9231ec721536ce0
related: [v0-4-0-local-installation-workflow, rebuilding-the-global-cmk-binary-after-code-changes, artifact-rebuild-for-v0-4-0]
---

To install all fixes into the global `cmk` command, run these four steps in sequence:

```
cd C:\Projects\claude-memory-kit\packages\cli
npm pack                                          # → lh8ppl-claude-memory-kit-<version>.tgz
npm uninstall -g @lh8ppl/claude-memory-kit
npm install -g .\lh8ppl-claude-memory-kit-0.4.0.tgz   # use explicit filename from npm pack
cmk --version                                     # verify (should show 0.4.0)
```

**PowerShell quirk:** Unlike bash, PowerShell does NOT glob `*.tgz` (literal `*` causes ENOENT). Always use the exact filename that `npm pack` printed.

**Expected**: `npm uninstall` may warn about EBUSY / better_sqlite3.node — harmless, install still succeeds.

**Why:** The installed global binary is what gate tests validate and what IDE/CLI actually invoke. This rebuild ensures all merged fixes are live before live-test sessions.

**How to apply:** Run after each merge of fixes to `packages/cli/`. Use before running Session 1 in Kiro (the live hook-firing test). Verify version output matches release tag.
