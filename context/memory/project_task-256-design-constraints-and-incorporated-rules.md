---
id: P-D5TKE5WW
type: project
shape: State
title: Task 256 Design Constraints and Incorporated Rules
created_at: 2026-07-23T18:20:35Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: bf07a2cec043bb38173bd72b1450fb7fc77ff4513438c735d50cd576c173b4c0
related: [decisions-scope-uses-direct-file-read-not-vector-db]
---

Design constraints (established by lead):
- Capped star with linear cost (addresses objection from Task 232)
- Noise guards for single-citer and stopword-grade anchors
- `cmk links D-361` capability — enables "what cites this decision" queries

Incorporated rules from prior tasks this week:
- Fixture-write ban (from Task 254 incident)
- PowerShell-only test rule
- D-293 semantic-reindex ban
- Code-fence stripping reuse
- Byte-stability determinism rules

**Why:** Constraints guide implementation decisions. Rules embody lessons learned this week and prevent regression to prior incidents.

**How to apply:** Reference when reviewing Task 256 code; apply the same rule patterns to subsequent tasks.
