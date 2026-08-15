---
id: P-SPBREG3F
type: project
title: HC-9 Drift After Claude Code Update (v0.3.4)
created_at: 2026-06-20T07:07:25Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 66768214101c2efe35f0d082869ab5778e302a3ca4c05b45f2b9dc765c02f654
related: [cmk-install-auto-updates-managed-block-version-stamps, core-memory-kit-installed-with-claude-code-hooks, mcp-activation-restart-behavior]
---

After updating Claude Code, `cmk doctor` may report HC-9 (health check) drift from expected state. This is expected behavior in v0.3.4 — Claude Code updates invalidate cached state that `cmk` maintains. Fix: run `cmk install` to restore alignment. This is a feature, not a bug.

**Why:** v0.3.4 detects when tool updates diverge the cached state and provides a simple recovery path. A future session encountering this drift needs to know it's not indicative of a real problem.

**How to apply:** After updating Claude Code, if `cmk doctor` reports HC-9 drift, just run `cmk install` — no further investigation needed.
