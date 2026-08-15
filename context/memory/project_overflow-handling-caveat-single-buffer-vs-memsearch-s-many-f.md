---
id: P-BBEZ4YaD
type: project
title: Overflow-Handling Caveat—Single Buffer vs. Memsearch's Many Files
created_at: 2026-06-18T20:21:12Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: d68ee78a6198e668663b8f89f2606e70c57393945ede4941f3ccdb66ab7addbd
related: [a-c-core-design-pivot-memsearch-anchored-b-dropped, release-plan-md-authoritative-task-to-lane-map, task-260-and-262-sequencing]
---

memsearch sidesteps overflow by aging out old files from the rolling window but keeping them on disk. We have a single monotonic `now.md`.

With B dropped and A capping input: the char-capped-off older portion still exists (data loss prevention) but must be routed somewhere explicitly. Two paths:
- Compress that overflow in a separate pass (multi-pass compress)
- Establish an explicit "compress oldest-first across multiple passes" rule before cap occurs

This is a compress-time concern, not mid-session, but needs a rule before B is dropped.

**Why:** A+C alone work for memsearch's shape (many files) but `now.md` is single growing buffer; trimmed overflow needs explicit handling, not just window-keep.

**How to apply:** Before finalizing the design, verify A+C + overflow rule fully prevents spiral on single buffer. Define the overflow rule (compress-oldest-first? overflow file?) before closing §8.2.5.
