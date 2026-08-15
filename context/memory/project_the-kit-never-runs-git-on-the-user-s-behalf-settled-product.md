---
id: P-VHMVDFZP
type: project
title: The kit NEVER runs git on the user's behalf — settled product position, user-con
created_at: 2026-06-11T07:26:31Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 21ffc8900f725e8deccd14296238a539101b3ac9
related: [automation-boundary-principle-for-claude-memory-kit, automated-capture-via-agentstop-hook, pii-handling-non-adoption-of-quarantine]
---

The kit NEVER runs git on the user's behalf — settled product position, user-confirmed 2026-06-11. The offered opt-in SessionEnd auto-commit of context/ was DECLINED.

**Why:** Hooks running git would race with the user's own staging/rebases and create per-turn commit noise; on public repos, reviewing the memory diff before commit IS the privacy gate (facts about the user would otherwise publish sight-unseen). The user: 'i wouldnt want to do git commands for people automaticly.'

**How to apply:** Memory writes ride the user's normal commit batches; the visible tail at session end is expected, not a bug. Do not re-propose auto-commit without new evidence.
