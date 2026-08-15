---
id: P-NWUYVLZN
type: project
shape: Timeless
title: Multi-Gate Release Verification
created_at: 2026-07-06T19:13:38Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 5af97368ff3539b73a2f767d40e072a9b9e30b01c7847193169127d7c7cde731
related: [pre-session-verification-checklist-structure, manual-verification-gates-for-tasks-74-and-151, cut-gate-testing-practice]
---

Standing pattern: before tagging any release, run (1) CLI-deterministic gate (kiro-cli + cursor-agent backends on real tarball), (2) Claude live-session gate, (3) Cursor live-session gate (manual). All three must pass. Non-blocking issues lane to next version; blockers prevent tagging.

**Why:** Catches integration failures that unit tests miss. Multi-agent + MCP-backend setup requires live verification to ensure safety.

**How to apply:** Document gate results (per D-281, D-282 pattern). Use results to determine go/no-go for tagging.
