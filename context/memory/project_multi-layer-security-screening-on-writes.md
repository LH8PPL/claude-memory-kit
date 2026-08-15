---
id: P-TZ35RJDJ
type: project
shape: Timeless
title: Multi-Layer Security Screening on Writes
created_at: 2026-07-12T04:14:58Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: f5fe8672a6d7f44ad4ea48ccb79ca9b8363fa721032887aaf6a343ce892bc37b
related: [hook-boundary-implementation-gap-privacy-strip-example]
---

Every committed-tier write (persistent storage mutations) gates through: curate/distill input+output, transcript promotion (withhold-not-defer principle, secrets-only visibility), persona queue, trust-increase re-screening. Poison_Guard side-door checks on entry/exit. PR #216 closes all known side doors.

**Why:** High-stakes data mutations need layered defense against poison-pill attacks and secret leakage.

**How to apply:** When adding write operations, build screens at curate→distill→transcript→trust stages. Use Poison_Guard check. Mark sensitive data for secrets-only handling.
