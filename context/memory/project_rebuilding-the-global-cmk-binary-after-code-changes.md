---
id: P-JZa9NZDF
type: project
title: Rebuilding the Global CMK Binary After Code Changes
created_at: 2026-06-21T16:05:12Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 6cbb6dcface1d3e81c020895b15918adbb093cad057751e1a2c120bc81188b8a
related: [artifact-rebuild-for-v0-4-0, global-cli-rebuild-and-reinstall-workflow, rebuild-global-cmk-cli-binary-release-process]
---

After code is merged to main, the globally-installed `cmk` binary does not auto-update. Rebuild steps:
1. `cd C:\Projects\claude-memory-kit\packages\cli`
2. `npm pack`
3. `npm uninstall -g @lh8ppl/claude-memory-kit`
4. `npm install -g .\lh8ppl-claude-memory-kit-0.4.0.tgz`
5. Verify: `cmk --version`

**Why:** Global npm installs are cached locally; source changes don't propagate to the installed binary

**How to apply:** After merging code changes, run this sequence before running doctor checks or other verification
