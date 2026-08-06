---
id: P-6DQGY2SY
aliases: [P-6DQGY2SY]
type: project
shape: Plan
title: 'Viewer-Page Redesign: Multi-Layer Validation Workflow'
created_at: 2026-08-05T20:42:04Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: fc689d3a5dbc9f24aa713837824f976ca67006d909114945c5e39e849dde9aff
---

Gate sequence for complex UI redesigns:
1. Encoding check (BOM, mojibake, line endings)
2. Structural gates: anti-XSS scan, zero-dependency check, region-marker extraction
3. Contrast test (ratios computed from served CSS)
4. Behavior preservation: full suite + stress test; 25/25 checks unchanged (skin-only rule)
5. Two-pass review: behavior didn't shift; design token caps held
6. Real corpus screenshots: not sample data (real: 15 checks, 2,213 files vs sample: 8 checks, 2,202 files)

**Why:** Multi-layer validation prevents regressions and accessibility breaks while shipping new visuals. Real corpus catches rendering issues sample data misses.

**How to apply:** Apply this gate sequence to all significant UI redesigns. All gates must pass. "25/25 unchanged" is a hard requirement for skin-only work. Task closes only after real corpus verification.
