---
id: P-W7TSERZR
type: project
title: Crystallization with Reviewable Proposals (Task 95)
created_at: 2026-06-11T22:15:30Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 8a906e3be60bc187ad5ea963660514132a5efe15
related: [core-philosophy-of-the-kit]
---

When near-duplicate facts are identified:
- Produce a readable, reviewable **proposal** rather than silent merge
- Proposed fact includes `superseded_by` provenance pointing to what was absorbed
- User accepts or rejects before finalization

**Why:** Achieves memclaw's deduplication goal (rot elimination) while maintaining kit's transparency and audit trail

**How to apply:** Crystallization produces a fact diff; user approves; `superseded_by` links track absorbed facts
