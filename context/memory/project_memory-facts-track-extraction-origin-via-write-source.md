---
id: P-94B7Z7SW
type: project
shape: Timeless
title: Memory Facts Track Extraction Origin via write_source
created_at: 2026-07-09T06:23:17Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0695498a724d0e3748061e89e233753f281969d4b12a92dec8776b0d2eddf6b6
related: [d-303-blocker-closing-via-live-kiro-re-test, kiro-hook-trust-system-configuration-d-194, three-tier-memory-architecture]
---

Saved facts include a `write_source` field indicating extraction method: `auto-extract`, `mk_remember`, explicit call, etc. Enables diagnosing which pathway succeeded and whether deduplication is masking auto-extract writes.

**Why:** Essential for debugging missing or duplicate facts across IDE gates and understanding whether auto-extract silently dedups or genuinely fails.

**How to apply:** When examining facts in Claude/Kiro/Cursor memory folders, inspect write_source to categorize which extraction mechanism fired and which did not.
