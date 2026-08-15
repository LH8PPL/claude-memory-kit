---
id: P-BKCWY2C6
type: project
title: Cron Job Registration Feature (HC-5)
created_at: 2026-06-20T07:50:51Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: e3a4c98399a5ef8ce8534dd9894bea01519a3db2a1bcd6b2fae014ddb4d2c2cc
related: [cmk-health-check-status-2026-06-20, cascade-starvation-lazy-distill-limitation-on-busy-repos, register-crons-for-staleness-starvation-prevention]
---

Cron registration enables scheduled background distill/curate cycles instead of relying only on lazy SessionStart fallback. Status on this repo: not registered (optional feature). Can be enabled with `cmk register-crons` — touches host scheduler, requires user approval.

**Why:** Without cron, lazy SessionStart fallback is the only automatic distill path, which starves on busy repos (cascade-starvation). Scheduled cron runs provide reliable daily/weekly cycles — the real fix for staleness on high-activity dogfood/test projects.

**How to apply:** For busy repos, recommend `cmk register-crons`. Requires explicit user approval before execution (scheduler integration). This is a feature the kit supports but this repo hasn't yet adopted.
