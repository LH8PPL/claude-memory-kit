---
id: P-UMH4G5A2
type: project
title: Bash tool cwd persists — cd into a workspace silently reroutes npm test
created_at: 2026-06-13T09:11:03Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 8949b18dce79cd49e49558c814751bb570bc983b
related: [never-overwrite-backups, claude-code-cd-compound-command-prompting-edge, use-c-temp-or-c-tmp-for-test-scratch-never-the-repo-or-home]
---

The Bash tool's working directory PERSISTS across calls within a session — a `cd packages/cli` earlier makes a later bare `npm test` run the CLI WORKSPACE's test script (6 tests, writes packages/cli/.test-logs/last-run.json), not the root suite (1800+ tests, root .test-logs/last-run.json). Reading the root last-run.json then shows stale/wrong counts. The PowerShell tool does NOT have this problem (it auto-resets to the project root each call).

**Why:** Burned ~two cycles this session reading 6-passed and a packages/cli error path as if they were the root suite; the cause was a persisted cd from an earlier inspect command, not a real failure.

**How to apply:** In the Bash tool, prefix root-suite commands with `cd /c/Projects/claude-memory-kit &&` (the CLAUDE.md guidance says prefer absolute paths / avoid relying on persisted cd). Or just use the PowerShell tool for `npm test`/`npm run stress`, which always runs from the project root.
