---
id: P-UR5Q5EAN
type: project
shape: Preference
title: Faithful Relocation for Memory Migration in Core-Memory-Kit
created_at: 2026-07-22T08:21:08Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 64e3d75a6f1be9c766addfda80bd2764046ac7f80dc32fe4af249b1ba8bff7c0
related: [misplaced-memory-files-recovered-to-root-context, preserve-legacy-id-when-creating-derived-ids, decision-trail-preservation-rule]
---

When migrating memory files between directories (e.g., from staging to canonical location), preserve files' original metadata by faithful relocation + reindexing, rather than re-ingestion via `cmk remember`. Re-ingestion via `cmk remember` re-stamps `created_at` to today, misrepresenting when knowledge was captured. Faithful relocation treats already-screened files as vetted artifacts and preserves semantic integrity of the archive.

**Why:** Timeline accuracy is essential to memory system integrity. Corrupting `created_at` dates obscures when knowledge was actually learned and breaks retrospective utility of the archive.

**How to apply:** When relocating memories, move the files + reindex to preserve ids and dates. Reserve re-capture for genuinely new facts, not for moving existing ones.
