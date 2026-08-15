---
id: P-7TYWM43U
type: project
title: Failure Signal Asymmetry in Oracle-Free Contexts
created_at: 2026-07-01T15:33:53Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ddf6710c2a658344bea3ab0f6b5341fe020427e7fef555cafcbb0afb93226bd2
related: [windows-ebusy-on-npm-global-update]
---

Failure detection is reliable (user corrections, re-asks, test failures, `cmk forget`). Success detection is silent — good recalls leave no trace. In kit's session-host context: **prune-on-failure is honest; reinforce-on-success is nearly impossible**.

**Why:** Architectural constraint that defines what success metric the kit can truthfully claim.

**How to apply:** Design memory-update policies to exploit asymmetry — bias toward pruning weak memories over reinforcing strong ones.
