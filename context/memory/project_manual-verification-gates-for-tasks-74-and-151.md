---
id: P-JHCFGZ7U
type: project
title: Manual Verification Gates for Tasks 74 and 151
created_at: 2026-06-30T15:14:07Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: d86585203396aa497c3892b95c1667c33d4169f6c7e02fb4ae346db1e8ee823e
related: [v0-4-0-final-gate-kh-kc-live-hook-firing-tests, live-cut-gate-requirement-unit-green-works-on-real-input, multi-gate-release-verification]
---

**Task 74 (Live Auto-Compaction):** Trigger a real auto-compact in a long session, confirm the snapshot reappears. Unit/integration tests + code verified; live compaction behavior cannot be auto-tested in CI.

**Task 151 (In-Chat Promotion Relay & MCP):** Verify optional promotion mention relay and `mk_lessons_promote` topic-routing in a live MCP session with Claude. Unit/integration + code verified; in-chat agent behavior cannot be auto-tested in CI.

**Why:** Features depend on runtime agent/session state that cannot be simulated. Honest caveats prevent over-claiming automation; live verification required before production.

**How to apply:** Before shipping a release with Tasks 74 or 151: (1) trigger Task 74 compaction in real session, confirm snapshot re-injects; (2) test Task 151 promotion relay + routing in live MCP session.
