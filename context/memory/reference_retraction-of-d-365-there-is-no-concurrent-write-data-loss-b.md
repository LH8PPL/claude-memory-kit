---
id: P-aKTA2KND
type: reference
shape: State
title: 'RETRACTION of D-365: there is NO concurrent-write data-loss bug. The probe was w'
created_at: 2026-07-20T08:59:11Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: 1c802814b397821d387d334ede33f795bddc4d8fd997c188c48d59d948e5d3dc
related: [bug-live-probed-2026-07-20-concurrent-scratchpad-writes-sile, unverified-auto-extract-has-never-automatically-written-a-fa, vitest-can-show-a-module-resolution-failure-cannot-find-modu]
---

RETRACTION of D-365: there is NO concurrent-write data-loss bug. The probe was wrong, not the kit. It counted bullets remaining in MEMORY.md and called the difference LOST, never checking where they went. Ground truth (16 serial writes, verified by grep across the whole tier): 8 bullets stayed in MEMORY.md, the other 8 GRADUATED into individual fact files under context/memory/ - each with its own file, an INDEX.md entry, and full searchability. All 16 accounted for, zero loss. Serial, staggered and parallel runs all produced the identical 9/16-in-MEMORY.md result, which is what proved it was never a concurrency race: a real lost-update race cannot reproduce with zero concurrency.

**Why:** I diagnosed a race from a symptom that pattern-matched one (concurrent writes, missing rows, exit 0) without ever running the serial baseline that would have falsified it in one minute. Then I wrote a lock to fix the non-bug. This is the same docs-claim-vs-code-ships error class I had just caught ECC on, and the second time in one session I asserted a conclusion from resemblance rather than measurement.

**How to apply:** Before reporting ANY data-loss bug: (1) run the SERIAL baseline first - if the loss reproduces without concurrency it is not a race; (2) account for every record across the WHOLE tier (memory/ fact files, archive/evicted-bullets.md, archive/superseded, tombstones) before using the word LOST, because this kit deliberately MOVES bullets between tiers on cap pressure; (3) read the audit log - it names every evicted/graduated id with its destination path. The kit's cap-relief is load-cap-not-write-cap by design (design 19, 20.3).
