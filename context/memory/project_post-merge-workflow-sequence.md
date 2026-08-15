---
id: P-WMPQSE4a
type: project
shape: State
title: Post-Merge Workflow Sequence
created_at: 2026-07-11T20:10:25Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0b17e1542d519758aecd598ab560112529eb707437a02be553519b3f47e0802f
related: [claude-memory-kit-v0-4-3-release-workflow, stress-gate-release-workflow, core-memory-kit-gate-chain-and-post-merge-workflow]
---

After PR stress tests pass:
1. Squash-merge the PR
2. Pull main
3. Watch main's CI (by named check, not generic polling)
4. Write build-log retro
5. Start next task on fresh branch

**Why:** Standard post-test deployment workflow; watching by name indicates a specific CI check to monitor before proceeding.

**How to apply:** When PRs pass all checks, follow this sequence; don't just wait for CI—monitor the named check explicitly.
