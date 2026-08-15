---
id: P-QH3aMMaD
type: project
shape: Timeless
title: Dogfood Repopulates User Tier During Active Sessions
created_at: 2026-07-12T12:31:14Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0dce2c815bbbe975d84a7ed8d6aec65ea29a685d91dfb74f3ee1b74d5c817dcf
related: [gate-preparation-tier-backups-and-dogfood-isolation, clean-start-procedure-for-session-1-test, claude-memory-kit-installation-levels]
---

The auto-extract/persona pipeline writes to the user tier continuously while working on this repo. Even after backing up the tier, continued session activity will repopulate it via dogfood.

Gate implication: B3/B4/B8 persona-fill checks behave differently against a pre-populated tier (trivial pass) vs a truly empty one (true capture-from-zero validation).

**Why:** The gate assumes persona capture from zero. Active dogfood in the working directory breaks that assumption, potentially masking persona-pipeline failures.

**How to apply:** To run an honest cut gate: back up the user tier again immediately before the gate's Session 1, or run the gate in an isolated directory (not this repo) to prevent dogfood repopulation.
