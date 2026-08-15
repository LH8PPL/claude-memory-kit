---
id: P-9PXGBNLT
type: project
title: 'F-7 Spec vs Code Mismatch: Tombstone Reading in cmk get'
created_at: 2026-06-16T11:18:09Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 34c0de2e96eee9ef40c0200ccacc5f29f3dff7e64c357872a8ccf7b3d420c161
related: [tombstone-data-lifecycle-forget-vs-purge, decisions-scope-uses-direct-file-read-not-vector-db, scope-documentation-discipline-record-why-not-just-what]
---

The cut-gate F-7 spec and CLI.md documentation claim `cmk get` reads tombstoned facts as a recovery path. In reality, the code is live-only: `forget` prunes the database row, and `get` cannot return a tombstoned fact. The tombstone *file* persists in `archive/tombstones/` as a disk recovery artifact, but `get` does not read it. Root cause: Task 110 design decision (live-only by design).

**Why:** Future cut-gate specification updates or F-7 work could accidentally claim unimplemented behavior. The spec must reflect the intentional live-only design.

**How to apply:** When updating F-7 or the cut-gate spec, correct the documentation to describe the actual live-only behavior and explain the tombstone file as a recovery artifact, not a `get` return path.
