---
id: P-STa54X7H
type: project
shape: Event
title: 'v0.5.0 Release Workflow: Stress → Commit → Push → PR → Merge → Repack → Gate'
created_at: 2026-07-09T18:04:01Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 5a392ff9bb8197ee6c5afee5c29b71878906cb20ff52bd0c5e5c1e6f92bb23b3
related: [v0-6-2-release-tail-workflow, v0-6-4-release-workflow-and-task-ownership, stress-gate-required-before-pr-for-spawn-hook-boundary-chang]
---

Release sequence for v0.5.0:
  1. Stress test (5/5) — must complete and pass
  2. Commit staged changes
  3. Push to remote
  4. Create PR and await CI green
  5. Merge PR
  6. Repack global (CRITICAL: kill mcp-serve PIDs first before repacking; mcp-serve must not be running during repack)
  7. Re-run Cursor gate (third and final agent gate for v0.5.0)

**Why:** Established workflow; mcp-serve PID kill is a non-obvious but required step to prevent repack failure or hang.

**How to apply:** For v0.5.0 completion, follow this exact sequence. For future releases, use as template. Never skip the PID kill step before repacking.
