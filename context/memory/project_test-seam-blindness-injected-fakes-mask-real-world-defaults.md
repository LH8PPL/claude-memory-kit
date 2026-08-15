---
id: P-SL5VE39X
type: project
shape: Timeless
title: Test Seam Blindness — Injected Fakes Mask Real-World Defaults
created_at: 2026-07-04T07:05:09Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 2ae4e17bbdf8620a6ba8652ea675302d9e0bc43effdd92b8a6de94b0bc5c23c9
related: [hook-inject-capture-tests-faked-dependencies-masking-bugs, wired-but-dead-observe-legs-recurring-bug-pattern, bom-d-fact-files-are-invisible-to-scanning]
---

Recurring bug class: tests inject fakes at a seam, but the real production default at that seam is untested. When downstream behavior changes, the real default breaks.

Three instances this session:
- D-269: Kiro sessions got empty memory snapshot since v0.4.0 (fake inject masked real default)
- Cursor's `afterFileEdit`: wired in core but dead in profile (fake worked, real broke when changed)
- Task 198's semantic finder: inert real default, fake worked, real broke when changed

All three fixed the same way: drive the real default against real-shaped data in tests.

**Why:** Test seams designed for isolation can become blindspots; test and production defaults drift unnoticed.

**How to apply:** For seams with real defaults, pair each fake-injection test with a real-default test using real-shaped data. Audit seams in code review.
