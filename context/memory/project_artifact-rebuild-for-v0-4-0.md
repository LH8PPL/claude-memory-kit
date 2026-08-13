---
id: P-4M7YD3MK
type: project
title: Artifact rebuild for v0.4.0
created_at: 2026-06-22T13:12:15Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 9a9cf91f6719d009a7e8b09a53828f8a0d1d0d3ba0640d3e36f7eea1df34431d
related: [rebuilding-the-global-cmk-binary-after-code-changes, v0-4-0-local-installation-workflow, rebuild-global-cmk-cli-binary-release-process]
---

To update the global `cmk` CLI with the latest fixes:
  1. `cd C:\Projects\claude-memory-kit\packages\cli`
  2. `npm pack`
  3. `npm uninstall -g @lh8ppl/claude-memory-kit`
  4. `npm install -g .\lh8ppl-claude-memory-kit-0.4.0.tgz`
  5. `cmk --version` (expect `0.4.0`)

EBUSY warning on step 4 is harmless.

**Why:** Deploy latest cross-agent fixes (D-185–191) to the global binary before running KH/KC live tests.

**How to apply:** Run after all merges complete; verify `cmk --version` shows `0.4.0`.
