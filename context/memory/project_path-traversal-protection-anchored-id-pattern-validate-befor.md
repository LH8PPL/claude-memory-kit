---
id: P-UBU2NFWX
type: project
title: Path Traversal Protection — Anchored ID Pattern + Validate-Before-Join
created_at: 2026-06-17T06:58:44Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 6941d58bf8abfa6f4701c682c3c4d571786f9f353816720a0a5b1762ef382d9e
related: [hand-written-research-note-frontmatter-requirements, reference-implementation-alignment-strategy]
---

Archive id-indexed reads protected by: strict ID_PATTERN regex (`/^[PUL]-[…8 base32 chars…]$/`; no `.`, `/`, `\`, `%`), validation at line 39 *before* the `join()` operation. Prevents attacks like `P-../../../etc`, `../../secret`. Ordering (validate-before-join) is critical; if future refactor reorders it, the pattern is bypassed.

**Why:** Whitelist-pattern validation before path construction is the correct defense; the ordering prevents regressions.

**How to apply:** For any archive id-indexed read, use anchored pattern and validate before join; document the ordering logic to prevent accidental reordering.
