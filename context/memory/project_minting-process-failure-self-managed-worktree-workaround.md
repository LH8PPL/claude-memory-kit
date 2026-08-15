---
id: P-CNGSL2KR
aliases: [P-CNGSL2KR]
type: project
shape: State
title: Minting Process Failure — Self-Managed Worktree Workaround
created_at: 2026-08-09T05:33:13Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 843c92f7a00e9be7fd2a195b3855837b1a3b58c832249c2fe0462993f8e36cf4
related: [powershell-glob-behavior-explicit-filename-required-for-tgz, cli-fallback-for-mcp-tool-resolution-failures, windows-ebusy-when-updating-cmk-during-claude-code-runtime]
---

Minting process is currently broken. Workaround used in lane 270 and applicable to other builds: manage git worktree manually instead of relying on the broken minting process.

**Why:** Unblocks builds when minting fails; allows pipeline to continue.

**How to apply:** When a build lane encounters minting failure, use manual worktree management as a known workaround before investigating root cause.
