---
id: P-U32aXXFV
type: project
title: Peer Systems Synchronize Consolidation on Stop Hook (Session END)
created_at: 2026-06-26T06:57:00Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: e47eb4ae1ea81b3e5e70e23754c44880a191c406d9c85ad6254a134f5f408d14
related: [task-167-shipped-live-test-overturned-the-grilled-q4-sync-dr, sessionend-hook-no-retry-constraint, sessionstart-hook-ceiling-constrains-synchronous-operations]
---

Research across claude-mem, mem0, Letta, Graphiti: all use event-driven synchronous consolidation on **Stop hook (session END)**, not SessionStart.

Kit architecture mirrors this:
- SessionEnd `compress-session` hook: 60s ceiling, user not waiting → room for synchronous Haiku
- SessionStart: 30s ceiling, user waiting → not ideal for synchronous work

**Validated pattern:** Synchronous consolidation at END (event-driven, no blocker) + detached floor at START (reliable backstop when END didn't fire) = correctness without user-facing latency.

**Why:** Resolves tension between Q4 ("correctness over speed") and live-test ceiling conflict. Peers validate this works; kit already has the SessionEnd infrastructure.

**How to apply:** Next decision: synchronous consolidation uses existing SessionEnd hook; SessionStart uses existing detached path as reliable floor (post-167.A cron-liveness fix).
