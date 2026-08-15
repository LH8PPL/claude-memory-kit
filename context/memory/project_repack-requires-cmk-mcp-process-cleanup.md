---
id: P-KF53SS2F
type: project
shape: Timeless
title: Repack Requires cmk mcp Process Cleanup
created_at: 2026-07-08T16:48:41Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 202fb6266388739a923d9069f7a5c38d4a748e1787cc43e9dcd7f91973d4ede7
related: [v0-5-0-release-workflow-stress-commit-push-pr-merge-repack-g, ebusy-during-cmk-upgrade-stale-process-diagnosis, gate-check-g0-cli-version-verification]
---

The global repack workflow (used during release finalization, e.g., v0.5.0 tag) requires terminating all `cmk mcp serve` processes first. Leaving them running breaks the reinstall step.

**Why:** Prior incident: a repack was attempted with mcp serve procs still active, causing install failure.

**How to apply:** Before running repack as part of tag finalization, explicitly kill `cmk mcp serve` processes (e.g., `pkill -9 cmk` or platform equivalent). Verify termination before proceeding.
