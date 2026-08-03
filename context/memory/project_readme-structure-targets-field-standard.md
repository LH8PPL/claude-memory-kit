---
id: P-CSSVUFU3
aliases: [P-CSSVUFU3]
type: project
shape: State
title: README Structure Targets Field Standard
created_at: 2026-08-03T13:36:08Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 7b5b51622dacd652a98d662341e69c79d945de0d3cb531448c11f8cf1f8d42a9
---

- ~12 feature bullets, max 20 words each (field maximum is 22 words across datasette, uv, claude-mem, turso)
- Link to `docs/FEATURES.md` for full documentation
- Structural order: Quick Start/Installation → feature list → Documentation section
- Current state violates this: 19 bullets averaging 85 words, max 179 (8x field ceiling)

**Why:** Field standard confirmed across successful tools; improves scannability and matches user's intuition

**How to apply:** Refactor README to ~12 bullets ≤20 words each; move current prose to docs/FEATURES.md; add word-count validator rule to prevent regrowth
