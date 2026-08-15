---
id: P-QREFRDFY
type: project
shape: Timeless
title: GitHub Actions Username Privacy-Mask Collision
created_at: 2026-07-19T06:38:07Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: b89b63780444194a6da78f59dd64479ca9d04767d8dcf93751bbcfd7bdc09baa
related: [npm-test-fragility-under-load, fixture-time-bomb-in-cli-backfill-test-2026-07-21, sonarcloud-then-in-object-false-positive-schema-fields]
---

The kit's privacy masking system masks the word "runner" (GitHub Actions' default username on ubuntu-latest). This causes FTS test failures on Linux only when fixtures reference "runner", because fixture content is masked but the test query is not. Workaround: reword test fixtures to avoid the word "runner". Issue documented in test class.

**Why:** Non-obvious behavior during CI testing; privacy mask works as designed but collides with GitHub Actions' own username convention. Future test debugging on Linux Actions may encounter this.

**How to apply:** When debugging FTS test failures on Linux Actions only, check if fixture content is being masked by the privacy system; if so, rename or reword to avoid masked terms.
