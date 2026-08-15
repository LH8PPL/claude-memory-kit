---
id: P-J9EDJSE7
type: project
title: v0.4.1 Fixed Three Prompt-Free Installation Bugs
created_at: 2026-06-27T07:07:52Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 3428cd95611d2880aedbbb85a7691ca79b441e23ff117cd2dbf277840ed7ca21
related: [fresh-folder-verification-workflow-for-claude-memory-kit-rel, session-checkpoint-v0-4-1-cut-gate-3-fixes-merged-awaiting-c, claude-code-2-1-198-permission-hook-regression]
---

- **Bug 169** (CC 2.1.x skill form): Skill gate syntax was correct, but Claude Code 2.1.x's permission prompt form changed; gate expected old form
- **Bug 170** (`--with-semantic` EBUSY): Trusted npm's exit code incorrectly; should validate the actual import, not just exit 0
- **Bug 171** (MCP wildcard collapse): `mcp__cmk__*` wildcard rules stopped auto-approving in CC 2.1.x; CC tightened per-tool security

**Why:** None of these three breaks are visible to unit tests (they require live Skill prompts or real locked-DLL installs). The cut-gate found them by live testing; they drove D-209/210/211 and Tasks 169/170/171.

**How to apply:** When verifying a new CMK release, use the fresh-folder + live test workflow (see separate fact). These three are merged and won't regress, but understanding them prevents similar misses.
