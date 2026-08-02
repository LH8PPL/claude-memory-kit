---
id: P-Fa5UYREN
type: project
shape: Timeless
title: Post-Merge Ship Workflow Sequence
created_at: 2026-08-02T07:56:32Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4ccd6be79a0b1376466f099fbeaf2ace6fd2c8f98055b0c33d09eb81c527247b
---

- Squash-merge feature PR to main
- Post-merge housekeeping on main:
  - Flip parent checkbox with ship date
  - Add retrospective entry to build-log
  - Update decision log with ship references
- Flush memory tiers (whole-tier rule, pre-screened)
- Enumerate CI check runs and monitor for failures (including SonarCloud separately)

**Why:** Ensures consistency, documentation, and prevents shipping with unclean state or undetected CI failures

**How to apply:** Execute this sequence in order on every ship; CI monitoring is critical to catch SonarCloud and other gates
