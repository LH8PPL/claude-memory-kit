---
id: P-X2ZJ6Y4J
type: project
title: 'writeFact silent failure mode: reindex failure swallowing'
created_at: 2026-06-14T07:37:53Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 5df7243a42bca5e66c00579b8ea36dd963eeb624
related: [hook-boundary-implementation-gap-privacy-strip-example, index-md-is-a-committed-human-readable-artifact]
---

- writeFact rebuilds INDEX.md on writes but the catch block silently swallows failures
- When hook timeout kills child mid-rebuild, INDEX drifts behind actual files with zero trace
- Silent corruption: committed INDEX.md is outdated, undetectable without audit
- Investigation ruled out: single-process race, multi-process race (8 concurrent writers tested), version differences

**Why:** Hidden failure mode caused INDEX corruption with no observable signal; was only discoverable via file audit

**How to apply:** PR #181 fix applied: failed reindex now writes INDEX_REBUILD_FAILED audit entry (observable); cmk doctor HC-4 already detects drift and guides user to cmk reindex
