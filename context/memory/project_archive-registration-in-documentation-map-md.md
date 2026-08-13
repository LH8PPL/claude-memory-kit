---
id: P-HNCCMUSB
type: project
shape: Timeless
title: Archive Registration in DOCUMENTATION-MAP.md
created_at: 2026-07-27T22:28:07Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ac19f8889bffe7fef54c887ce845a2618bfc97d98df6721e89294433e81667af
related: [dual-readme-files-must-stay-synchronized, validate-docs-enforces-catalog-consistency, version-snapshot-in-recent-md-guards-against-cross-session-a]
---

Each new archive must be registered in `docs/DOCUMENTATION-MAP.md` (Spine block for main files; `docs/journey/` block for journey docs). This makes archived content discoverable to users.

**Why:** DOCUMENTATION-MAP is the authoritative index of project artifacts. Unregistered archives are orphaned.

**How to apply:** After creating an archive, add an entry to DOCUMENTATION-MAP.md grouped by directory/context. Keep the map up-to-date.
