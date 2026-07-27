---
id: P-RXDC53YR
type: project
shape: Timeless
title: Git Fixture Byte Normalization Verification
created_at: 2026-07-27T08:19:12Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: f25c1401b812444a45f06545e59d147a0d60e58e780e182258b96ce1b1a52744
---

Git's normalization machinery (line endings, encoding) can corrupt fixture bytes. Committed fixtures must survive git normalization unchanged (byte-for-byte).

**Why:** Fixture integrity is critical for reproducible tests; git handling can corrupt carefully-formatted or binary fixture data

**How to apply:** When adding/updating test fixtures, verify that fixtures survive git handling (check bytes pre-commit and post-clone).
