---
id: P-XBP5CZTQ
aliases: [P-XBP5CZTQ]
type: project
shape: Plan
title: 'Run cmk register-crons After PR #351 Ships'
created_at: 2026-08-09T07:30:22Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 93bf3f72ecdad1fcc9aef5fe2a5af3b5c3676756fb253b3c2088cea3c9777c5d
related: [tarball-installation-requires-re-packing-after-main-merges, task-252-maskpii-completed-five-sonar-smells-fixed, task-255-viewer-design-grill]
---

After PR #351 merges and ships, run `cmk register-crons` once on your machine to repair starving scheduled tasks. The root cause: cron flags were re-stamped by a catch-up fix that's already in place — this command registers them.

**Why:** Crons starved for five nights; one-off command fixes them without code changes.

**How to apply:** After #351 is merged and deployed, run `cmk register-crons` locally to refresh the scheduled task flags.
