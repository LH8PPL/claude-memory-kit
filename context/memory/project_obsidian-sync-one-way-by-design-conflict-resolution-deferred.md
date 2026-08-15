---
id: P-R7WCYVPC
aliases: [P-R7WCYVPC]
type: project
shape: Timeless
title: Obsidian Sync One-Way by Design; Conflict Resolution Deferred
created_at: 2026-08-15T08:52:31Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: bc6b5e7b4f1872858bc44c31103d1839172fbd9de0368f235f7e86187e4822f7
---

Obsidian sync deliberately one-way because conflict resolution is unsolved — they deferred the problem.
Contrasts with offline-write-queue + conflict-queue pattern in the extension (multi-way with explicit resolution).

**Why:** Shows a common architectural tradeoff (simplicity vs. capability). Our conflict queue is the harder, more capable approach they avoided.

**How to apply:** When designing sync/replication, remember one-way is a common dodge; multi-way + conflict queue is the differentiator.
