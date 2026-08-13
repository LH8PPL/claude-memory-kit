---
id: P-2RMM6CSE
aliases: [P-2RMM6CSE]
type: project
shape: State
title: Namespace Encoding for Purge/Tombstone Prevention
created_at: 2026-08-13T13:05:01Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 6fe05d1f3528b7e19b794224ce187842f4ceef28d22dc401eb429f3108b139d7
---

- **Problem:** PR #281's fix created an irreversible state where purge destroys the neighbor's tombstone.
- **Solution:** Structurally complete encoding with both case-pair members escaped, making the derived namespace disjoint from legacy names.
- **Implementation:** Frontmatter-verified archive reads to convert wrong-content cases to honest not-found (instead of silently using stale data).

**Why:** Critical bug discovered during v0.6.6 review that causes silent data loss via irreversible tombstone destruction.

**How to apply:** When implementing namespace-derived operations (purge, archive queries), use case-pair escaping and frontmatter verification to prevent neighbor destruction and detect wrong-content conditions.
