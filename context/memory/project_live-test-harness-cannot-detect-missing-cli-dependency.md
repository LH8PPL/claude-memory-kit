---
id: P-AMGLK4QZ
type: project
shape: Absence
title: Live-test Harness Cannot Detect Missing CLI Dependency
created_at: 2026-07-04T07:43:06Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 6185d9ce3dde4bcea6e34c08bb329a3873e8b4c6b5c1032615ed22a75f98e2c7
related: [task-146-concurrent-swarm-support-testing, kit-s-haiku-backend-has-undeclared-claude-cli-dependency, cut-gate-must-test-published-artifact-not-repo-code]
---

The `live-test.mjs` harness hardcodes `claude` CLI calls and runs on the developer's machine (which has Claude Code installed).

This means it **passes while the bug remains hidden** — it can't simulate or detect that Cursor/Kiro users without Claude Code would fail silently.

**Why:** The harness was designed only for Claude Code. It can't test multi-agent scenarios where a target agent doesn't have its assumed dependencies.

**How to apply:** Future testing should either mock/simulate missing `claude` CLI for Cursor/Kiro paths, or test on a machine where Claude Code is NOT installed. Do not rely on the current harness to validate agent-specific readiness.
