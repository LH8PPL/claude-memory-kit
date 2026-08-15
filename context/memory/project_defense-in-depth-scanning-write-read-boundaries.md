---
id: P-GG37266G
type: project
shape: Timeless
title: 'Defense-in-Depth Scanning: Write + Read Boundaries'
created_at: 2026-07-07T20:16:58Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 9585f095b1a5fcdced85fb993ace39930d941d74a8abc9532dafa642761be95a
related: [stop-hook-path-budget-constraint, release-workflow-tag-before-merging-new-work, poison-guard-mjs-specific-provider-patterns-are-by-design]
---

Content scanned at write-time AND re-scanned when read from disk into prompt snapshot. Catches on-disk poisoning that bypassed write-time check.

**Why:** Protects against file-level tampering; relevant for memory system where files persist between sessions

**How to apply:** Consider implementing two-point scanning if on-disk file integrity is part of threat model for final design
