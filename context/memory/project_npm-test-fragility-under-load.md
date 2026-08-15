---
id: P-QXYKPC2C
aliases: [P-QXYKPC2C]
type: project
shape: Absence
title: npm test Fragility Under Load
created_at: 2026-08-13T13:16:25Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4910252e69c1782efb946ae96f9b1cef46ae1f6ce4aa58bd6331f83f711ba8a7
related: [ci-authority-convention, hc-2-distill-freshness-fail-self-clears, onnxruntime-node-postinstall-cdn-timeout]
---

Local `npm test` execution is unreliable when run under machine load on both development machines. Observed: D-430 class suite-level failures on live-Haiku near their 90s ceiling. Flagged for v0.7 backlog (Task 279).

**Why:** Important to recognize this as a known local-env issue, not a code defect, when debugging test failures during active development

**How to apply:** When local npm test fails under load, check ubuntu CI gate first; if CI passes, it's an environmental issue (Task 279 v0.7)
