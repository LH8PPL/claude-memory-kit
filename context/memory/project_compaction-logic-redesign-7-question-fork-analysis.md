---
id: P-U6G6HABS
type: project
title: 'Compaction Logic Redesign: 7-Question Fork Analysis'
created_at: 2026-06-25T20:04:26Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: a1ba7aba19baff9688180b8740c33ab25535f7e88f7b8f93e15f4b9456fb14f1
related: [auto-heal-path-for-v0-4-1-task-167-d-169-binding]
---

Session compaction logic overhaul involves ~7 numbered decision points:
- **Q1:** Absorb-the-verdict — decided
- **Q2:** Derive+heartbeat hybrid — decided
- **Q3:** Two-methods-rich-return — decided (confirmed this turn)
- **Q4:** Lazy roll behavior (detached vs synchronous) — pending
- **Q5–Q7:** Not yet described

For Q4 (lazy roll when cron is dead and now.md is bloated):
- **Option A (detached):** Lazy roll spawns in background; drains `now.md` during *next* session. Fast startup, but bloat can compound if cron stays dead across multiple sessions.
- **Option B (hybrid, recommended):** Normally detached, but synchronously drain `now.md` *before* SessionStart if size exceeds hard ceiling. Proposed ceiling: ~50KB (5–10× normal size, well below observed 410KB bloat).

Rationale for Option B: Original bug manifested because healing deferred session-to-session, allowing bloat to compound. Pure detached approach repeats this failure. Hard-ceiling hybrid prevents runaway bloat while keeping normal startup fast. Precedent: OpenWolf/Windows-Automatic-Maintenance pattern (opportunistic normally, deadline-forced catch-up when needed). Aligns with task 167.B spec.

**Why:** Prevents compound bloat bug while maintaining fast startup for normal cases. Synchronous drain is rare safety net, not common case.

**How to apply:** Implement Option B with configurable ceiling (~50KB). Wire compaction check to: if `now.md` size > ceiling AND cron appears dead, drain synchronously before SessionStart. Test with deliberately-bloated `now.md` to verify synchronous path works.
