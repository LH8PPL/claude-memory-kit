---
id: P-RSXX6JWW
type: project
title: Global Install Auto-Recreates User-Tier Directory
created_at: 2026-06-25T11:26:15Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 574c5db93063ea9bfcd6d0a31b8b2078a5dd769a95b33b3a1fc49389b36a8c32
related: [global-cli-rebuild-and-reinstall-workflow, cli-installation-verification-workflow, user-tier-memory-backup-before-testing]
---

Installing @lh8ppl/claude-memory-kit globally via `npm install -g` automatically recreates ~/.claude-memory-kit even if deleted. This can affect test isolation when running multiple scenarios or comparing branch states.

**Why:** Observed during post-rebuild verification; important for test design and cleanup between runs

**How to apply:** Account for this in pre/post-test cleanup; explicitly delete ~/.claude-memory-kit before running isolated tests if prior state must be excluded
