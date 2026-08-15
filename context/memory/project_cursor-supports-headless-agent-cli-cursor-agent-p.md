---
id: P-55XE6aJA
type: project
shape: Timeless
title: Cursor Supports Headless Agent CLI (`cursor-agent -p`)
created_at: 2026-07-04T07:43:06Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 363479c3ba1795d4c32111eb0301c2071ed674029c523fbb92c82c1db016886e
related: [kiro-cli-env-passing-limitation, kit-s-haiku-backend-has-undeclared-claude-cli-dependency, two-tier-backend-architecture-for-headless-llm-invocation]
---

Verified that Cursor has a headless agent command: `cursor-agent -p` (works in cloud/headless environments).

Note: GUI-only hooks (`sessionStart`, `afterAgentResponse`) don't fire in headless mode; other hooks do.

**Why:** This is a viable option for replacing the hard `claude` CLI dependency if the kit switches to per-agent backends (option c from the dependency-resolution decision).

**How to apply:** If the team chooses to use per-agent headless CLIs as backends, Cursor can use `cursor-agent -p` instead of shelling out to `claude`.
