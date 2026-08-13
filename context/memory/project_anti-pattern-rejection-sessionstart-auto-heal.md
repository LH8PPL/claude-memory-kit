---
id: P-J7D46R62
type: project
title: 'Anti-Pattern Rejection: SessionStart Auto-Heal'
created_at: 2026-06-14T08:28:19Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 47edf9090dc73c6d93ab6f74e29ab772a33d4a9765998f0b6d398f0d4c827496
related: [index-drift-self-heal-architecture]
---

Proposed adding SessionStart auto-heal to rebuild INDEX if drifted. Rejected as over-engineering.

**Reasons:**
- Adds I/O (fact-dir scan) to every session start — a hot-path penalty.
- Fixes a cosmetic lag in a convenience doc (nothing functional reads INDEX).
- Edge case: rare (INDEX lagged AND no capture since AND human opened INDEX AND noticed).

The kit's design ethos discourages "what if we also add X" feature creep.

**Why:** The incidental next-capture self-heal suffices. Hot-path cost is not justified for cosmetic drift.

**How to apply:** When evaluating SessionStart additions, prioritize hot-path performance. Prefer test-backed contracts over preventive machinery.
