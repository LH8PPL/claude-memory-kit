---
id: P-NaE3TNXZ
type: project
title: Re-Pack + Verify Workflow for Cut-Gate Testing
created_at: 2026-06-26T16:45:58Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: d57c06ab624882ec8d3765ccee033b344b40618c7c454ffe5b0e4ff06eb1c680
related: [cmk-fix-verification-workflow-fresh-folder-v0-4-1, rebuilding-the-global-cmk-binary-after-code-changes, rebuild-artifact-after-bug-fix-without-re-cutting-release]
---

When a fix is merged to main, before continuing the cut-gate with the fixed version:

1. Pull + re-pack the global cmk:
   - `cd C:\Projects\claude-memory-kit && git pull` (ensure latest fix is pulled)
   - `cd packages\cli && npm pack`
   - `npm uninstall -g @lh8ppl/claude-memory-kit && npm install -g .\lh8ppl-claude-memory-kit-<version>.tgz`
2. In the gate project, run `cmk install` to overwrite settings.json
3. Delete `.claude\settings.local.json` (so gate tests kit's own allow-list, not manual overrides)
4. Restart Claude Code in the gate project
5. Verify: re-state a preference (e.g., "always use uv, never pip") — the affected skill should run with NO prompt

**Why:** The installed global cmk version has the old code. Re-packing + reinstalling ensures the gate tests the merged fix. Deleting settings.local.json prevents manual overrides from masking the real behavior.

**How to apply:** Run this workflow after any fix is merged to main, before resuming the cut-gate testing cycle.
