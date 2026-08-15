---
id: P-T6Q2QWHE
type: project
title: Version Snapshot in recent.md Guards Against Cross-Session Amnesia
created_at: 2026-06-16T14:15:10Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 0fede1d36e298c28ff35618132aa5a44356fbd177fbadd10e722da120c144302
related: [project-tracking-structure, commit-guardrail-blocks-ambiguous-include-exclude-instructio, tag-and-publish-v0-3-5-release]
---

After each version ships, update `recent.md` with an authoritative block stating which version shipped and which is next (e.g., "v0.3.2 SHIPPED, v0.3.3 NEXT"). This prevents stale snapshots from confusing new sessions about the current version state.

**Why:** New sessions load memory to understand project state. A stale version snapshot would make them think an older version is current (e.g., v0.3.1 when v0.3.2 shipped). The snapshot is a guard rail for session continuity.

**How to apply:** After each version ship, add/update the version block in `recent.md`, commit + push it so new sessions read the correct state on first load.
