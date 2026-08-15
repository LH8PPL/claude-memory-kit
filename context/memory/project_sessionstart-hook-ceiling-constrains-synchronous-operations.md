---
id: P-MHHNDDZD
type: project
title: SessionStart Hook Ceiling Constrains Synchronous Operations
created_at: 2026-06-26T06:50:03Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 7fd630c5bfd0819f0c33723f2ad4f7da47fc06905b873b853489718662e14d43
related: [30s-hook-ceiling-constraint-real-haiku-roll-timing, cron-liveness-fix-167-a-solves-root-problem-sync-drain-is-se, peer-systems-synchronize-consolidation-on-stop-hook-session]
---

- **Hard constraint:** SessionStart hook ceiling is 30 seconds
- **Observed latency:** Real Haiku calls take 18–37 seconds on this machine
- **Impact:** Synchronous drain cannot reliably complete within budget; times out, falls back to detached path
- **Verified:** Detached (async) path succeeds, healing now.md on next session

**Why:** The live test (real `claude --print`, actual call latency) exposed that Q4's synchronous-drain goal cannot fit the hook ceiling. This is a hard architectural constraint determining solution viability.

**How to apply:** When choosing options A/B/C (sync vs. detached decision), use this constraint to evaluate feasibility. Sync operations must fit ~25s to leave margin; larger operations require detached paths.
