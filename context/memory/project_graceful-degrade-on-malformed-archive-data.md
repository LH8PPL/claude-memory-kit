---
id: P-4EZT6FPU
type: project
title: Graceful Degrade on Malformed Archive Data
created_at: 2026-06-17T06:58:44Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 788af4fd35cd7aefdf19153e084d7efc7f2d6e216c8b8a0877cdce270f6db194
related: [tombstone-data-lifecycle-forget-vs-purge]
---

Recovery operations (e.g., reading tombstones) degrade gracefully on malformed entries rather than crash: missing/garbled frontmatter → return raw body + null provenance + `tombstoned: true`. Recovery path never throws; worst case is partial metadata loss. Worth explicit test case: malformed tombstone file (no/garbled frontmatter) → `tombstoned: true`, body present, provenance nulls.

**Why:** Recovery happens *because* something went wrong; crashing would prevent recovery. A graceful-degrade contract should be locked by test.

**How to apply:** For recovery/read paths encountering malformed data, return best-effort recovery (body + nulled metadata) rather than error; test the malformed-entry path explicitly.
