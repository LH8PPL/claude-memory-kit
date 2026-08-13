---
id: P-CRRQ4RT2
type: project
title: Avoid Duplicating Authoritative Docs in Temp Locations
created_at: 2026-06-28T07:58:37Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 211a4152c496eb4b1334085dffa4aafc857d8335ab5dc85fcabf0bf6fc80378d
related: [index-md-is-a-committed-human-readable-artifact, social-card-assets-location, platform-specific-cut-gate-structure-and-scope]
---

Creating convenience reformats/checklists of authoritative docs (like `docs/process/cut-gate.md`) in temporary or scratch locations violates the project's single-source-of-truth discipline. Duplicate copies drift from the source and create maintenance burden.

**Why:** Only the authoritative doc is maintained; duplicates become stale and can mislead future sessions.

**How to apply:** Keep reformats truly temporary (unsaved), or link directly to the authoritative source. Do not commit or cache parallel versions.
