---
id: P-7PNY7XKE
type: project
title: Test Hierarchy for Automatic-Path Verification
created_at: 2026-06-25T20:08:46Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 1118190bd1eb66421ec703f24f8527902a718d3ebb6e92b70c7ae8364828a9bf
related: [cut-gate-test-pattern-for-automatic-cron-drain-healing, task-167-testing-agent-run-unit-live-agent-loop-user-does-no]
---

- **Cut-gate primary test** (integration): Fire SessionStart against trap state; assert it healed. Proves the mechanism *actually fires automatically.* Catches D-169-class bugs.
- **Unit tests** (supporting): Verify pieces in isolation—`isCompactionNeeded` cron-liveness gate, sync-drain cooldown bypass, failed-call cooldown handling, heartbeat writes.
- **Role split**: Unit tests prove the mechanism exists; cut-gate test proves the mechanism fires without manual intervention.

**Why:** Integration bugs (mechanism works, but never triggers automatically) are invisible to unit tests alone. The D-169 root cause was exactly this gap.

**How to apply:** Design both layers for automatic systems. Unit tests verify each piece; cut-gate integration test verifies end-to-end automatic flow with zero manual commands.
