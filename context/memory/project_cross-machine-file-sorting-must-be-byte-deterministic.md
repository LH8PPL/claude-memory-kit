---
id: P-B6UMaKWN
type: project
title: Cross-Machine File Sorting Must Be Byte-Deterministic
created_at: 2026-07-02T06:59:05Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 3779144cb48111517d68ab5f151352538eba38e9b52058f89129362fb6588e86
related: [use-deterministic-comparators-for-sorting-committed-files, map-module-sort-determinism-localecompare-banned-explicit-or]
---

- ISO-dated filenames (`today-*.md`) must sort chronologically-identically on every machine
- Locale-dependent comparators like `localeCompare` break this guarantee and cause non-deterministic builds
- Must use byte-identical comparators (direct string comparison) instead

**Why:** Build reproducibility and cross-machine determinism; files sorted differently per locale breaks CI/distribution

**How to apply:** When sorting dates or filenames, use string comparison or explicit byte-order comparators; never use `localeCompare` for build-critical sorts
