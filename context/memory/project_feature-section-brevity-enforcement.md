---
id: P-EVK62ZJL
aliases: [P-EVK62ZJL]
type: project
shape: State
title: Feature Section Brevity Enforcement
created_at: 2026-08-03T13:49:43Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e6089731d680cc524276048e7b82a52b3a22c2bf32ff960920861eaa61684a96
related: [readme-structure-targets-field-standard]
---

- README Feature bullets: max 25 words (enforced in `validate-docs` CI check)
- Feature section must link to `docs/FEATURES.md` for full detail prose
- Threshold set 3 words above field best-practice (22 words) to catch *growth* without over-penalizing good writing
- Full feature descriptions moved to `docs/FEATURES.md` with subheadings

**Why:** Prevents README bloat; field research across datasette, uv, claude-mem, turso confirms ≤22 words per bullet is standard

**How to apply:** Any README Feature edits trigger validator; move content over 25 words to `docs/FEATURES.md`
