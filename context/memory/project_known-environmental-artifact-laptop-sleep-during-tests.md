---
id: P-T6PYE5VP
type: project
shape: Absence
title: 'Known Environmental Artifact: Laptop Sleep During Tests'
created_at: 2026-07-13T07:38:38Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 6341b0e83307b49924a245b763a6f110656a6b8df91fe7e63eee55dc7635a228
related: [stress-gate-testing-strategy, validation-gate-chain-and-stages, ci-authority-convention]
---

When laptop sleeps mid–stress-run, `--version` tests record 3–hour clock gaps, creating false negatives (test failures that are not real bugs, only timing artifacts).

**Why:** Distinguishing environmental failures from real bugs is critical for trusting test results and avoiding unnecessary debugging.

**How to apply:** Ensure machine stays awake during full stress gate runs. If `--version` tests show large clock gaps, investigate sleep activity rather than treating it as a real failure.
