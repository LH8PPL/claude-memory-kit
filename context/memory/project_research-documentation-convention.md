---
id: P-2GRPQKFa
type: project
title: Research Documentation Convention
created_at: 2026-06-18T19:59:19Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 10862fc4496cec8da2c98a0e111fad0dff51ee3f94e6c75a2017f1d6938a73d0
related: [decision-trail-recording-convention-for-divergences, review-based-decision-correction, release-gate-documentation-format-in-cut-gate-md]
---

Research files in `docs/research/` follow a consistent structure:
  - Dated filenames (e.g., `2026-06-18-session-buffer-compaction-under-latency-growth.md`)
  - Frontmatter with `source:` listing all systems checked
  - "Scope vs. original mandate" section documenting: (1) original scope, (2) coverage, (3) scope expansion, (4) deliberate omissions with rationale
  - Per-system comparison table with mechanics
  - Reference section with dated clones (matching file date)

**Why:** Shows what was originally asked vs. what was actually researched; prevents re-checking systems; documents decision rationale and scope changes transparently

**How to apply:** Follow this structure when documenting research phases. When reviewing existing research, check "Scope vs. original mandate" to understand full context and whether scope was expanded intentionally
