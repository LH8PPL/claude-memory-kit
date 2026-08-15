---
id: P-NQYBBLXL
type: project
title: Live-test gate structure and blocker findings
created_at: 2026-06-21T17:04:28Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 0e891b30120a5fb71f8c49247d3849aac11aaad1b36e3085b7af2883dac84c99
related: [v0-4-0-final-gate-kh-kc-live-hook-firing-tests, kiro-v0-4-0-release-code-complete-pre-release-checkpoints, d-197-end-to-end-live-re-test-workflow]
---

The gate has 5 runs and two phases of checks:

- **Phase 1 (steps §0–§1)**: Unit tests + Windows input behavior. Found 3 cut-blockers (D-185, D-186, D-187), all in the "unit-green, broken on real Windows input" class. D-186 is a sub-bug of D-185; D-187 caught by BOM sweep. These would have shipped in v0.4.0 without this gate.
- **Phase 2 (KH/KC)**: Live IDE/CLI hook firing checks. Not yet reached. This is where the "does it actually fire?" risk lives.

Gate purpose: catch issues that pass unit tests but break on real Windows input.

**Why:** The live-test gate is the release-validation step that prevents shipping broken builds. Early phases catch input-handling bugs; later phases verify IDE/CLI integration works.

**How to apply:** Reference this structure when understanding gate failures, or planning Session 1 in Kiro (the live hook-check phase).
