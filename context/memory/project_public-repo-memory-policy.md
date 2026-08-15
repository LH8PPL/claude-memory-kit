---
id: P-MHKMPLCR
type: project
title: public-repo memory policy
created_at: 2026-06-10T07:22:15Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: b187d767b4db77b4d0c79c1132d678794594d13f
related: [cut-gate-v050-scaffold-gitignore-transcript-leak, three-tier-memory-architecture, cut-gate11-memory-system-three-tier-architecture]
---

this PUBLIC repo commits curated memory tiers only

**Why:** transcripts and session logs carry raw dev-conversation content (name-privacy class), so they stay machine-local here; a normal private project commits them (D-108 deviation)

**How to apply:** committed: context/MEMORY.md, SOUL.md, context/memory/ facts; gitignored: context/transcripts/, context/sessions/ — lines live OUTSIDE the kit's managed gitignore block so reinstalls keep them
