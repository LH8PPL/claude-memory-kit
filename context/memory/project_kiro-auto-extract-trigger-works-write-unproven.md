---
id: P-JMZJ6ERL
type: project
shape: State
title: 'Kiro Auto-Extract: Trigger Works, Write Unproven'
created_at: 2026-07-09T06:23:17Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: f598cb734d6c2bcb8c02751444afcd22ca063fa68c903c485c49add851c82c5b
related: [d-303-test-environment-confirmed-ready, d-303-blocker-closing-via-live-kiro-re-test, unverified-auto-extract-has-never-automatically-written-a-fa]
---

**Proven:** Stop hook fires (extract.log confirms); capture/inject/recall/wedge/privacy all work; IDE transcript parser extracts both turns correctly.

**Unproven:** Whether auto-extract writes facts independently on Kiro; 0 `write_source: auto-extract` facts exist across any Kiro folder.

**To settle:** Fresh Kiro session where user states a preference the model does NOT explicitly `mk_remember`, then observe whether `write_source: auto-extract` fact appears independently. If yes → Kiro fully green; if no → investigate what the child turn-file actually contains.

**Why:** Last unknown before Cursor validation. Determines whether "Kiro fully green" holds for claude-memory-kit testing.

**How to apply:** Run the one-preference clean test, document result (fact appears or doesn't), use to guide next investigation or Cursor gate start.
