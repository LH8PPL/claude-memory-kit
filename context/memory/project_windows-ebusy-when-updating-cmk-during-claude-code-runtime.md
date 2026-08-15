---
id: P-JZ3JaU7L
type: project
title: Windows EBUSY When Updating CMK During Claude Code Runtime
created_at: 2026-06-18T18:55:44Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 6aae984f4353cbde9890fc8a3c39c31d5af8182cb5938022ebbae64e9f19b90d
related: [windows-ebusy-on-npm-global-update, close-claude-code-before-global-cmk-install-to-avoid-ebusy, npm-uninstall-ebusy-error-with-better-sqlite3-node-on-rebuil]
---

npm update for CMK (and potentially other installs) fails with EBUSY on Windows if Claude Code desktop is running. The running process locks DLL files, preventing the npm update. Workaround: close Claude Code before running `npm install -g claude-memory-kit@latest`. Hit twice during testing.

**Why:** Real blocker for Windows users. The EBUSY error is cryptic with no guidance on the cause or fix.

**How to apply:** In update docs, add a platform-specific note under "Troubleshooting" or "Prerequisites": "On Windows, close Claude Code before running updates."
