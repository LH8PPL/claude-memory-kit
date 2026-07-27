---
id: P-BV4KNXE3
type: project
shape: State
title: BOM-Prefixed Files and ID Generation
created_at: 2026-07-27T07:42:31Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 47cc8b299201168b9bac0a2681824036962cbe5c0c7308c5f9745c3742e07dce
---

- **The bug**: collision guard in `writeFact` read BOM'd files as id-less and overwrote them without tracing the collision — a silent data-destruction path.
- **The fix**: heal-on-rewrite behavior. Legitimate operations (`cmk trust`, `redact`, `merge`) now drop the BOM, so damaged files self-heal through normal use.
- **Cross-implementation alignment**: Node and Python were generating different IDs for the same BOM-prefixed content. Python now aligns to Node (reference implementation), pinned with a parity vector.
- **Test coverage**: new regression test for the collision-guard path.

**Why:** BOM handling was silently destroying data; understanding the alignment strategy and heal-on-rewrite pattern prevents regression and clarifies the reference implementation relationship.

**How to apply:** In future sessions, if BOM-related issues arise, recall that heal-on-rewrite is the self-correcting mechanism, and Node is the ID-generation reference for parity.
