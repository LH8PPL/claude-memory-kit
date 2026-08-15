---
id: P-WG9UMC6N
type: project
shape: State
title: 'v0.5.2 code-complete; PR #286 pending CI merge'
created_at: 2026-07-13T13:52:01Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 5f0d6c6ed597b84a4fe0cce0a42253920b76d8a8463325789fb403031503bb19
related: [v0-5-2-release-complete, kiro-v0-4-0-release-code-complete-pre-release-checkpoints, version-0-3-3-release-features-and-test-coverage]
---

**PR #286 state:** Open and CI running
**Shipped in v0.5.2:**
- Codex adapter (#284)
- Kiro-fix (#285)
- CLI↔MCP parity fix (#286) — freshness fix + 4 parity drifts closed + process-listener leak fix (self-caught)
- Stress tests: 5/5 PASS (confirmed)
**Pending:** CI merge to main
**Remaining work:** Task 208 (Cursor+Codex interactive live-gates) — requires real agent sessions and user tokens

**Why:** Release readiness state. Future session needs to know whether #286 merged and what manual work remains for v0.5.2.

**How to apply:** Before cutting v0.5.2, confirm: (1) #286 merged to main, (2) Task 208 complete or scheduled. Once both yes, release is code-ready.
