---
id: P-GFRV2Z9Q
type: project
shape: State
title: 'Metadata Column: Free-Form JSONB with PII Flags'
created_at: 2026-07-07T20:23:07Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 1bdf963aa24fc1a8f07621446c942d45cf79704a06274ea417f1227cebc2505a
related: [cmk-version-bumping-convention, powershell-utf-8-corruption-in-changelog-handling, research-notes-indexed-via-research-index-not-documentation]
---

The `metadata` column stores a JSONB dict (not typed schema columns). PII flags like `contains_pii` and `pii_types` are keys in this dict, accessed via JSONB operations.

**Why:** Confirmed by source inspection; flexibility supports dynamic PII tagging.

**How to apply:** When querying PII status, use JSONB operators (e.g., `metadata->'contains_pii'`), not column references.
