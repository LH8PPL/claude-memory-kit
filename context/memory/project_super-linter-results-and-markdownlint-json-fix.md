---
id: P-Y77aBUFL
type: project
title: Super-Linter Results and `.markdownlint.json` Fix
created_at: 2026-06-23T08:21:25Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: ea843ead5ec083e548d995a1280528b661a1a0b14a38fa294ae1fffeb87cef4c
related: [super-linter-real-run-1058-md-findings-context-included, lint-clean-memory-output-plan-and-progress, memory-format-linting-fix-md007]
---

- **The Problem:** 1,058 total findings; 824 in `context/`. Dominant: MD022 (blank lines around headings) with 842 hits. Code linting passes.
- **Root Cause:** Auto-generated markdown (memory extraction, DECISIONS.md) lacks blank lines around headings, tripping default markdownlint rules.
- **The Fix:** Commit `context/.markdownlint.json` relaxing cosmetic rules (MD022, MD007, MD012, MD034, MD025, MD053). Per-directory overrides verified in Super-Linter.
- **Optional:** Normalize generators to emit blank-around-headings and 4-space lists upstream.

**Why:** Real tool evidence proves memory tier markdown collides with default rules. Users get hundreds of lint warnings immediately on kit install. A shipped `.markdownlint.json` unblocks adoption.

**How to apply:** Build the `.markdownlint.json` with the six relaxations, ship as `context/.markdownlint.json`.
