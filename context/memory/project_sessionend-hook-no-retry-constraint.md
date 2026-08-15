---
id: P-6SESSZ33
type: project
title: SessionEnd Hook No-Retry Constraint
created_at: 2026-06-19T07:14:08Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 66b98963d8c7d7d45e68d3fb66b0b6827a6f43729bb1e64f1f05650911c74961
related: [retry-configuration-strategy-by-path, peer-systems-synchronize-consolidation-on-stop-hook-session]
---

- **Rule:** SessionEnd-hook compress must NOT retry
- **Conflict:** 50s retry + 50s compress = 100s total exceeds 60s ceiling under concurrent persona call
- **Delegation:** Lazy compress path (unbounded) handles retries instead
- **Safety:** Restore-on-failure pattern preserves session state until lazy compress runs

**Why:** Protect concurrent persona call latency SLA while maintaining compression safety and reliability.

**How to apply:** SessionEnd-hook fail → restore-on-failure → queue lazy compress for next session. No retry loop in hook itself.
