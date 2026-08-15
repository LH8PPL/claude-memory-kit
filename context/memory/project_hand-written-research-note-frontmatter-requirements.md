---
id: P-7H2PPU7U
type: project
shape: Timeless
title: Hand-Written Research Note Frontmatter Requirements
created_at: 2026-07-07T13:04:20Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 7b6a38ddeab7638941b8fa3ffdab25496fbfd73f1b29d2fcf2db030435837d3f
related: [tarball-artifact-must-carry-both-d-263-and-d-264, validate-docs-enforces-catalog-consistency, fact-file-write-constraint-forward-only-no-mass-rewrites]
---

Research notes (type: reference) must include `id` and `title` frontmatter fields. Missing fields prevent indexing into the archive.

**Why:** Frontmatter is required for the fact archive to properly index and retrieve notes; without it, notes remain orphaned and unsearchable.

**How to apply:** Verify that any hand-written research notes have valid `id` and `title` in frontmatter before committing; fix missing fields immediately if discovered.
