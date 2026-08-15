---
id: P-U72QNAYa
type: project
title: 'Gate Check G0: CLI Version Verification'
created_at: 2026-06-26T15:34:33Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: a8f4f25902e0331f06601b1a419f057b0800dfffe8e60e48bf6c9d2ab87c100b
related: [npm-pack-global-install-for-artifact-testing-0b, rebuilding-the-global-cmk-binary-after-code-changes, rebuild-artifact-after-bug-fix-without-re-cutting-release]
---

After `npm install -g .\lh8ppl-claude-memory-kit-*.tgz`, run `cmk --version` and verify it outputs exactly `0.4.1`. If it outputs `0.4.0` or earlier, the global install failed or is stale — re-run `npm install -g .\lh8ppl-claude-memory-kit-*.tgz`.

**Why:** Confirms the packed `.tgz` was correctly installed to the global npm scope. Failure indicates a broken install that must be fixed before proceeding.

**How to apply:** Run immediately after install. If version mismatch, troubleshoot the install (e.g., clear npm cache, verify `.tgz` exists) and reinstall before moving to backup and scaffold.
