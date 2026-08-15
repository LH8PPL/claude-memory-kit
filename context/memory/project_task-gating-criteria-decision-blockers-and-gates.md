---
id: P-FT6QKCBS
type: project
title: Task Gating Criteria (Decision Blockers and Gates)
created_at: 2026-06-28T20:50:10Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 12de3b171ec9f85f6c43157b4dd52cd6e71030d5f2a816149f58627c724c77e4
related: [memclaw-s-6-passive-outcome-signals-3-already-produced]
---

**Phase-3 gating (57, 58, 59):** Feature marked "PROPOSED — awaiting explicit go" in specs. Blocked until user green-lights the feature.

**Measure-first gating (68):** Spec says "build only if live test proves stale threads mislead Claude". Blocked until measurement happens.

**Design-first gating (150):** Settled decision D-126 says "don't auto-commit memory". Task 150 must thread needle: propose-in-chat, don't auto-commit. Blocked until design pass.

**Reframe gate (71):** Not a bug, nice-to-have. Current framing "refuse hand-edits" fights git-native design. Correct framing: "detect + re-screen + flag". Deprioritize post-reframe.

**Why:** These are legitimate parked states (not forgotten). Each has a clear gate that, when crossed, unblocks the task. Makes the backlog legible.

**How to apply:** When reviewing task list, check gate status. For Phase-3, ask: "do you want this feature?". For 68, run measurement. For 150, design session. For 71, reframe and re-prioritize.
