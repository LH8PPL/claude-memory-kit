---
id: P-BQ3WWXQG
type: project
shape: State
title: Stress Gate Testing Strategy
created_at: 2026-07-13T07:38:38Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 356755dd65007d3a3a398379b6544d79391f72c54a16b39abff14576f46a25d7
related: [known-environmental-artifact-laptop-sleep-during-tests, stress-gate-process-for-pr-merge, five-point-stress-gate-and-auto-launch-pr-workflow]
---

- Gate criterion: 5× full suite runs on committed, clean tree
  - Run timing: ~149 seconds per run
  - Pass requirement: all 5 must pass before PR opens
  - Critical: machine must stay awake during gate (sleep causes false negatives)
  - Test target: detached copy of committed tree to avoid edit conflicts

**Why:** Ensures high confidence in merge; environmental artifacts like laptop sleep and clock drift can produce flaky test failures that are not real bugs.

**How to apply:** Before opening PR, initiate 5-run gate on committed tree with machine actively monitored/awake. Recognize 3-hour clock gaps in `--version` tests as sleep artifacts, not failures.
