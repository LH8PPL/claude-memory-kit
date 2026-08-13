---
id: P-XM69AQHY
type: feedback
shape: State
title: 'Anti-stalling directive (the user, 2026-07-23): ''we had it for 6 weeks and nothi'
created_at: 2026-07-23T08:35:53Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: 372a2958e659440906ac954013f2190efb98fff5dca91d117f87a9df8f16304d
related: [distinction-between-deferred-and-committed-work, task-laning-strategy-and-trigger-discipline, d-343-disposition-cmk-install-scaffold-refresh-bug-task-230]
---

Anti-stalling directive (the user, 2026-07-23): 'we had it for 6 weeks and nothing, like alot of things we defered it for no reason. now i want to be decisive and just do it, no more stalling things.' When the user engages with a parked/deferred item, the default motion is LANE IT into a committed version slot, not refresh its trigger. 'Parked >1 minor AND the user re-raised it' = automatic lane-it signal. Does not overturn D-248's trigger discipline for untouched items; it biases boundary cases toward commitment.

**Why:** Six weeks of parked-viewer (D-121) with demand evidence and zero motion is the precedent; deferral-by-default was costing real features

**How to apply:** At any deferral decision the user participates in: propose a lane, not a trigger; reserve triggers for items nobody has re-raised
