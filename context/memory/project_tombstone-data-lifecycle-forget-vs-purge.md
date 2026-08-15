---
id: P-MEVGaRK7
type: project
title: Tombstone Data Lifecycle — Forget vs. Purge
created_at: 2026-06-16T11:20:47Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 86999c16bc71d7490569ed1f0bf317201063e581c38f90b1b651394b94b9a4cb
related: [f-7-spec-vs-code-mismatch-tombstone-reading-in-cmk-get, read-path-inconsistency-get-lacks-deleted-at-filter, decisions-scope-uses-direct-file-read-not-vector-db]
---

- `forget` writes the fact to `archive/tombstones/<id>.md` (preserving body, `deleted_at`, `reason`, `deleted_by`)
- Simultaneously prunes the database row
- Result: fact is preserved on disk but no command surfaces it (get returns "not found", search excludes by default)
- `purge --hard` is the true deletion path (removes both DB row and tombstone file)
- This design is intentional: distinguish "forget = reversible" (data kept) from "purge = destructive" (data gone)

**Why:** Product decision pending on recovery surfaces. Current architecture is the constraint: data exists (kept by design), so recovery would be a read operation, not a reconstruct. This context informs scope and feasibility.

**How to apply:** When evaluating recovery features (e.g., `cmk restore` or `get --include-tombstoned`), remember the design intent: forget was always meant to be reversible. Recovery is technically possible (data is there), just not currently wired.
