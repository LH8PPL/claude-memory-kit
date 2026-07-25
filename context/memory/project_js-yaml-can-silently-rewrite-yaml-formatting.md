---
id: P-ZPEJQHPC
type: project
shape: Timeless
title: js-yaml Can Silently Rewrite YAML Formatting
created_at: 2026-07-25T09:18:28Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: bf4341313595578759ffeed54ba67c754f8b16c886c3e7bf7cb5aac8446818a0
---

When js-yaml re-serializes YAML, it may reorder keys and change quoting styles. This silently rewrites the byte representation, violating byte-preservation guarantees if exact byte-identity must be maintained (e.g., during fact id-repair or content-addressed storage). Detected test cases include multiline strings, CRLF line endings, and quoted colons.

**Why:** Caught during reviewer scrutiny of id-repair implementation; reviewer must validate with hostile YAML test cases and byte-by-byte diffs to ensure the claim holds.

**How to apply:** When editing YAML with js-yaml and byte-preservation is critical: either parse-and-emit without modification, or use a formatting-preserving library. Always validate repaired files with `diff` against originals to catch silent changes.
