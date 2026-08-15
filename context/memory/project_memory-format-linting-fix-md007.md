---
id: P-Q3FHXP5B
type: project
title: Memory Format Linting Fix (MD007)
created_at: 2026-06-23T07:59:54Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: fa7c853da2db9cd6995cd98dcd12de9bfebce3cea7497a344cfc3ec9e9e509a0
related: [real-markdownlint-output-on-memory-md007-not-md013, actual-linter-output-is-md007-not-assume-ra5d4f96, md007-is-model-output-indent-not-provenance-format]
---

The provenance comment format trips **markdownlint rule MD007** (indented code as list item), not the assumed MD013/MD033/MD041 stated in current docs.
- **Fix:** Create committed `context/.markdownlint.json` disabling MD007 (optionally MD012/MD034)
- **Scope:** markdownlint auto-applies per-directory configs; exemption stays in `context/`, never touches user's root config
- **Prettier:** Add `context/` entry to `.prettierignore`
- **Docs correction:** CLAUDE.md claims format "trips MD041/MD013"—should say MD007

**Why:** Original decision (ADR-0009) was made on incomplete information. Real linter output differs from theory. This fix uses linter's intended mechanism (per-directory config), not a workaround.

**How to apply:** Implement .markdownlint.json + .prettierignore + install/uninstall wiring + test + correct CLAUDE.md. Ensures user's CI passes on kit's memory files without touching their root linter config.
